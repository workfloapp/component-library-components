/** @flow */
import React from 'react'
import Theme from 'js-theme'
import { is, List } from 'immutable'
import { flowRight as compose } from 'lodash'

import { Colors, Fonts } from '@workflo/styles'

import type { CompletionDataT } from '../../types/Completion'
import {
  Component,
  type ComponentTree,
  Helpers,
  Path,
  Prop,
  RenderCallback,
  TextNode,
  type TraverseContext,
} from '../../modules/ComponentTree'
import ComponentRenderer from './components/ComponentRenderer'
import type { InteractionStateT } from './types'
import generateTraversalMap, { type TraversalMapT } from './utils/generateTraversalMap'
import { ADD_CHILD, ADD_SIBLING, ADD_PROP } from '../../modules/ComponentTree/constants'

/**
 * Props
 */

type PropsT = {
  tree: ComponentTree,
  completionData: CompletionDataT,
  nodeIdGenerator: Function,
  onChange?: Function,
  onInsertProp: Function,
  onRemoveProp: Function,
  onRemoveComponent: Function,
  onInsertComponent: Function,
  onChangePropName: Function,
  onChangePropValue: Function,
  onChangeComponentName: Function,
  onSelectComponent: Function,
  theme: Object,
}

/**
 * State
 */

type StateT = {
  componentTree: ComponentTree,
  interactionState: InteractionStateT,
  traversalMap: TraversalMapT,
}

/**
 * ComponentTree component
 */

class ComponentTreeEditor extends React.Component {
  props: PropsT
  state: StateT
  blurTimeoutId: ?number

  static defaultProps = {
    nodeIdGenerator: () => Math.random().toString(),
  }

  constructor(props: PropsT) {
    const { tree } = props
    super(props)
    this.state = {
      componentTree: Helpers.enhanceWithPaths(tree),
      interactionState: {
        focusedNodePath: null,
      },
      traversalMap: compose(generateTraversalMap, Helpers.enhanceWithPaths)(tree),
    }
  }

  componentWillReceiveProps(nextProps) {
    const { tree } = nextProps
    if (tree !== this.props.tree) {
      this.updateComponentTree(tree)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.interactionState.focusedNodePath !==
      prevState.interactionState.focusedNodePath
    ) {
      this.clearEmptyNodes()
    }
  }

  render() {
    const { completionData, onChangePropName, onChangePropValue, theme } = this.props
    const { componentTree, interactionState } = this.state
    const rootNode = componentTree.get('root')

    return (
      rootNode &&
      <div {...theme.componentTreeEditor}>
        <ComponentRenderer
          key={rootNode.get('id')}
          isRootComponent
          onChangeNode={this.handleChangeNodeAttribute}
          onChangePropName={onChangePropName}
          onChangePropValue={onChangePropValue}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onFocusNext={this.handleFocusNext}
          onFocusPrevious={this.handleFocusPrevious}
          onInsertNode={this.handleInsertNode}
          completionData={completionData}
          componentNode={rootNode}
          componentTree={componentTree}
          interactionState={interactionState}
        />
      </div>
    )
  }

  /** Deletes empty nodes that are currently not in focus */
  clearEmptyNodes = () => {
    const { onRemoveComponent, onRemoveProp } = this.props
    const { componentTree, interactionState, traversalMap } = this.state
    const focusedNodePath = interactionState.focusedNodePath
    const focusedNodeId = focusedNodePath
      ? componentTree.getIn(focusedNodePath.pop()).id
      : null
    const parentFocusedNodeId = focusedNodePath
      ? componentTree.getIn(focusedNodePath.pop()).id
      : null
    /** Find empty nodes */
    const traverseResult = Helpers.traverse(
      componentTree,
      List(),
      (ctx: TraverseContext, type) => {
        const node = ctx.node
        const path = ctx.path
        /** We never remove the root node */
        if (type === 'post' || path.last() === 'root') {
          return ctx
        }
        if (
          (node.nodeType === 'prop' && !node.get('name')) ||
          (node.nodeType === 'component' && !node.get('name')) ||
          (node.nodeType === 'text' && !node.get('value'))
        ) {
          return ctx.set('data', ctx.data.push(node.id))
        }
        return ctx
      }
    )

    const nodesToRemove = traverseResult.data

    const modifiedComponentTree = nodesToRemove.reduce((tree, nodeId) => {
      /** Don't clear a prop name or value if either is being edited */
      if (is(nodeId, focusedNodeId) || is(nodeId, parentFocusedNodeId)) {
        return tree
      } else {
        const nodeToRemove = tree.getIn(Helpers.findNodeById(tree, nodeId))
        if (nodeToRemove.nodeType === 'component') {
          onRemoveComponent(nodeToRemove.get('id'))
        }
        if (nodeToRemove.nodeType === 'prop') {
          onRemoveProp(nodeToRemove.get('id'))
        }
        return Helpers.removeNodeById(tree, nodeId)
      }
    }, componentTree)

    /**
     * If the focusedNodePath was deleted by the logic above, then focus to the next
     * node that is still in the tree, if there is one. Note the extra pops
     * on the path are to get from the node attribute to the node itself (needed because
     * 'add-button' is not actually in the componentTree but we treat it like a node attribute)
     */
    if (focusedNodePath && !modifiedComponentTree.hasIn(focusedNodePath.pop())) {
      let nextFocusedNodeAttribute = traversalMap.get(focusedNodePath).next
      while (nextFocusedNodeAttribute) {
        if (modifiedComponentTree.hasIn(nextFocusedNodeAttribute.path.pop())) {
          this.focusNodeAttribute(nextFocusedNodeAttribute.path)
          break
        }
        nextFocusedNodeAttribute = traversalMap.get(nextFocusedNodeAttribute.path).next
      }
    }

    if (!is(modifiedComponentTree, componentTree)) {
      this.updateComponentTree(modifiedComponentTree)
    }
  }

  focusNodeAttribute(path: Path, type?: string) {
    const { onSelectComponent } = this.props
    const { componentTree } = this.state
    const targetNode = componentTree.getIn(path.pop(), null)

    /**
     *  If a blur event is immediately followed by a focus event, we cancel the
     *  blur timeout callback from firing, since it is redundant and can cause
     *  extra intermediate updates which can cause perceived bugginess in UI.
     */
    if (this.blurTimeoutId) {
      clearTimeout(this.blurTimeoutId)
      this.blurTimeoutId = null
    }

    /** If the targetNode exists we focus it, otherwise we must create it first */
    if (targetNode || !type) {
      this.setState({
        interactionState: {
          focusedNodePath: path,
        },
      })
      if (targetNode.nodeType === 'component') {
        onSelectComponent(targetNode.get('id'))
      }
      /** We only create a new node if the type has been specified as a parameter */
    } else if (type) {
      /** We convert from the path of the node attribute to the path of the new node */
      const newPath = path.pop()
      if (type === 'prop') {
        this.insertNode(newPath, ADD_PROP, Prop())
      }
    }
  }

  handleChangeNodeAttribute = ({ path, value }) => {
    const { onChangeComponentName } = this.props
    const { componentTree } = this.state
    const modifiedComponentTree = componentTree.setIn(path, value)
    this.updateComponentTree(modifiedComponentTree)

    /** Invoke individual callbacks for certain types of changes */
    const parentNode = componentTree.getIn(path.pop())
    if (parentNode.nodeType === 'component' && path.last() === 'name') {
      onChangeComponentName(parentNode.get('id'), value)
    }
  }

  handleBlur = (path: Path) => {
    /**
     * If the node being blurred is the node being focused then the focused node
     * should be set to null. If another node has alreadty been focused in the meantime,
     * as is likely to happen, then do nothing.
     */
    if (is(this.state.interactionState.focusedNodePath, path)) {
      this.blurTimeoutId = setTimeout(() => {
        if (is(this.state.interactionState.focusedNodePath, path)) {
          this.setState(
            {
              interactionState: {
                focusedNodePath: null,
              },
            },
            () => {
              this.clearEmptyNodes()
            }
          )
        }
        this.blurTimeoutId = null
      }, 100)
    }
  }

  handleFocus = (path: Path) => {
    this.focusNodeAttribute(path)
  }

  /**
   * Handles traversing forwards in the editor via keyboard navigation.
   */
  handleFocusNext = (path: Path) => {
    const { traversalMap } = this.state
    const currentNode = traversalMap.get(path)
    const nextNode = currentNode && currentNode.next
    /** If there is a next node in the traversalMap then we focus that node */
    if (nextNode) {
      this.focusNodeAttribute(nextNode.path, nextNode.type)
    }
  }

  /**
   * Handles traversing backwards in the editor via keyboard navigation.
   */
  handleFocusPrevious = path => {
    const { componentTree, traversalMap } = this.state
    const currentNode = traversalMap.get(path)
    let previousNode = currentNode && currentNode.previous

    /** This prevents us from creating new nodes while traversing backwards */
    while (previousNode) {
      if (componentTree.hasIn(previousNode.path)) {
        this.focusNodeAttribute(previousNode.path)
        return
      }
      previousNode = traversalMap.get(previousNode.path).previous
    }
  }

  /**
   * Adds node of a certain type to a place in the componentTree relative to the
   * given path.
   */
  insertNode = (
    path: Path,
    type = ADD_PROP | ADD_SIBLING | ADD_CHILD,
    emptyNode: Prop | Component | RenderCallback | TextNode
  ) => {
    const { nodeIdGenerator, onInsertComponent, onInsertProp } = this.props
    const { componentTree } = this.state

    if (type !== ADD_PROP && type !== ADD_SIBLING && type !== ADD_CHILD) {
      console.warn('ComponentTreeEditor.insertNode(): Invalid second parameter, type')
    }

    const insertionPath = Helpers.getInsertionPath(componentTree, path, type)
    const newNode = emptyNode.set('id', nodeIdGenerator())
    const newTree = Helpers.insertNodeAtPath(componentTree, insertionPath, newNode)

    this.updateComponentTree(newTree, () => {
      if (newNode.nodeType === 'component' || newNode.nodeType === 'prop') {
        this.focusNodeAttribute(insertionPath.push('name'))
      }
      if (newNode.nodeType === 'text') {
        this.focusNodeAttribute(insertionPath.push('value'))
      }
    })

    const parentPath = insertionPath.pop().pop()
    const parentComponent = componentTree.getIn(parentPath)
    const insertionIndex = insertionPath.last()
    if (type === ADD_PROP) {
      onInsertProp(parentComponent.get('id'), insertionIndex, newNode, newNode.toJS())
    } else if (type === ADD_SIBLING || type === ADD_CHILD) {
      onInsertComponent(
        parentComponent.get('id'),
        insertionIndex,
        newNode,
        newNode.toJS()
      )
    }
  }

  handleInsertNode = (path, type, emptyNode) => this.insertNode(path, type, emptyNode)

  updateComponentTree = (componentTree: ComponentTree, callback?: Function) => {
    const { onChange } = this.props
    const enhancedTree = Helpers.enhanceWithPaths(componentTree)
    /** This check prevents us from getting into render loops */
    if (onChange && !is(componentTree, this.props.tree)) {
      onChange(componentTree)
    }
    this.setState(
      {
        componentTree: enhancedTree,
        traversalMap: generateTraversalMap(componentTree),
      },
      callback
    )
  }

  //
  // handleRemoveProp = (nodeId: NodeIdentifierT) => {
  //   this.props.onRemoveProp && this.props.onRemoveProp(nodeId)
  // }
  //
  // handleRemoveComponent = (nodeId: NodeIdentifierT) => {
  //   this.props.onRemoveComponent && this.props.onRemoveComponent(nodeId)
  // }
  //
  // handleInsertComponent = (
  //   parentNodeId: NodeIdentifierT,
  //   index: number,
  //   component: Component
  // ) => {
  //   component = component.set('id', this.props.nodeIdGenerator())
  //   const { onInsertComponent } = this.props
  //   onInsertComponent &&
  //     onInsertComponent(parentNodeId, index, component, component.toJS())
  // }
  //
  // handleChangePropName = (
  //   componentId: NodeIdentifierT,
  //   nodeId: NodeIdentifierT,
  //   name: any
  // ) => {
  //   const { onChangePropName } = this.props
  //   onChangePropName && onChangePropName(componentId, nodeId, name)
  // }
  //
  //
  // handleChangeComponentName = (nodeId: NodeIdentifierT, name: any) => {
  //   const { onChangeComponentName } = this.props
  //   onChangeComponentName && onChangeComponentName(nodeId, name)
  // }
  //
  // handleSelectComponent = (nodeId: NodeIdentifierT) => {
  //   this.props.onSelectComponent && this.props.onSelectComponent(nodeId)
  // }
  //
  // handleSelectNode = (nodeId: NodeIdentifierT) => {}
}

/**
 * Theming
 */

const defaultTheme = {
  componentTreeEditor: {
    ...Fonts.code,
    color: Colors.grey300,
    backgroundColor: Colors.grey900,
  },
}

const ThemedComponentTreeEditor = Theme('ComponentTreeEditor', defaultTheme)(
  ComponentTreeEditor
)
export default ThemedComponentTreeEditor
