/** @flow */
import { List, Record } from 'immutable'
import type {
  ComponentT,
  ComponentTreeT,
  MapExpressionT,
  PropT,
  PropValueT,
  RenderCallbackT,
  StatusT,
  TextNodeT,
} from './types'

/**
 * Flow types
 */

/**
 * ComponentTree implementation
 */

/**
 * Path used for getting and setting nested children in ComponentTree
 */
const Path = List
export { Path }

/**
 * Record for displaying the status of a node
 */
const defaultStatusValue: StatusT = {
  isValid: true,
  message: '',
}
export const Status = Record(defaultStatusValue)

// PropValue

const defaultPropValue: PropValueT = {
  id: null,
  path: List(),
  nodeType: 'prop-value',
  status: Status(),
  type: null,
  value: null,
}

const PropValue = Record(defaultPropValue)
export { PropValue }

// Prop

const defaultProp: PropT = {
  id: null,
  nodeType: 'prop',
  name: '',
  path: List(),
  value: null,
}

const Prop = Record(defaultProp)
export { Prop }

// Component

const defaultComponent: ComponentT = {
  id: null,
  nodeType: 'component',
  name: null,
  path: List(),
  props: List(),
  children: List(),
}

const Component = Record(defaultComponent)
export { Component }

// Render Callback
const defaultRenderCallback: RenderCallbackT = {
  id: null,
  nodeType: 'render-callback',
  child: null,
  params: '',
  path: List(),
}
export const RenderCallback = Record(defaultRenderCallback)

// Text Node
const defaultTextNode: TextNodeT = {
  id: null,
  nodeType: 'text',
  path: List(),
  value: '',
}
export const TextNode = Record(defaultTextNode)

// Map Expression
const defaultMapExpression: MapExpressionT = {
  id: null,
  collection: '',
  children: List(),
  path: List(),
}
export const MapExpression = Record(defaultMapExpression)

// ComponentTree

const defaultComponentTree: ComponentTreeT = {
  root: null,
}

const ComponentTree = Record(defaultComponentTree)

export type ComponentTreeNodeT = Prop | Component | PropValue

export { ComponentTree }
export default ComponentTree
