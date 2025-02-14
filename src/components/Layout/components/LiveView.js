/** @flow */
import React from 'react'
import Theme from 'js-theme'

import { BreakPoints, Colors } from '@workflo/styles'

import Column from './Column'
import Row from './Row'

type Props = {
  bottomPanel: React.Element<*>,
  children: React.Element<*>,
  leftPanel: React.Element<*>,
  rightPanel: React.Element<*>,
  showLeftPanel: boolean,
  showRightPanel: boolean,
  showBottomPanel: boolean,
  tabletShowLeftPanel: boolean,
  isFullscreen: boolean,
  theme: Object,
}

/** Layout provider for rendering a LiveView with bottomPanel, rightPanel and leftPanel sections */
const LiveView = ({
  bottomPanel,
  children,
  leftPanel,
  rightPanel,
  showBottomPanel = true,
  showLeftPanel = true,
  showRightPanel = true,
  isFullscreen,
  theme,
}: Props) => {
  if (isFullscreen)
    return (
      <Column {...theme.container}>
        {children}
      </Column>
    )
  return (
    <Column {...theme.container}>
      <Row {...theme.middle}>
        {showLeftPanel &&
          leftPanel &&
          <Column {...theme.leftPanel}>
            {leftPanel}
          </Column>}
        <Column {...theme.content}>
          {children}
        </Column>
        {showRightPanel &&
          rightPanel &&
          <Column {...theme.rightPanel}>
            {rightPanel}
          </Column>}
      </Row>
      {showBottomPanel &&
        bottomPanel &&
        <Row {...theme.bottomPanel}>
          {bottomPanel}
        </Row>}
    </Column>
  )
}

const defaultTheme = ({ tabletShowLeftPanel }) => ({
  bottomPanel: {
    flexShrink: 0,
    flexBasis: 300,
    backgroundColor: Colors.grey900,
    zIndex: 10,
  },
  container: {
    flexGrow: 1,
  },
  content: {
    /**
     * This is a hack to prevent the layout from breaking when we pass in very large
     * numbers as the width of the LiveView.
     * TODO: Don't set large width on any elements outside of the iFrame (including the iframe)
     */
    width: 0,
    minHeight: 0,
    /** end hack */
    overflow: 'hidden',
    flexGrow: 1,
  },
  leftPanel: {
    flexBasis: 300,
    overflow: 'hidden',
    [`@media(max-width: ${BreakPoints.tabletLarge}px)`]: {
      flexBasis: 0,
    },
  },
  rightPanel: {
    flexBasis: 400,
    overflow: 'hidden',
    [`@media(max-width: ${BreakPoints.tabletLarge}px)`]: {
      flexBasis: 0,
    },
  },
  middle: {
    flexGrow: 1,
  },
})

export default Theme('LiveView', defaultTheme)(LiveView)
