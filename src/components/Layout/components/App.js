/** @flow */
import React from 'react'
import Theme from 'js-theme'

import { BreakPoints, Colors, Spacing } from '@workflo/styles'

import Column from './Column'
import Row from './Row'

type Props = {
  children: React.Element<*>,
  leftNav: React.Element<*>,
  header: React.Element<*>,
  showHeader: boolean,
  showLeftNav: boolean,
  tabletShowLeftNav: boolean,
  isFullscreen: boolean,
  theme: Object,
}

/** Layout provider for rendering an App shell with header, leftnav and content sections */
const App = ({
  children,
  header,
  leftNav,
  showHeader = true,
  showLeftNav = true,
  isFullscreen,
  theme,
}: Props) => {
  if (isFullscreen) {
    return (
      <Row {...theme.container}>
        <Column {...theme.main}>
          {children}
        </Column>
      </Row>
    )
  }
  return (
    <Row {...theme.container}>
      {showLeftNav &&
        leftNav &&
        <Column {...theme.leftNav}>
          {leftNav}
        </Column>}
      <Column {...theme.page}>
        {showHeader &&
          header &&
          <Row {...theme.header}>
            {header}
          </Row>}
        <Row {...theme.main}>
          <Column {...theme.content}>
            {children}
          </Column>
        </Row>
      </Column>
    </Row>
  )
}

const LEFT_NAV_WIDTH = 250

const defaultTheme = ({ tabletShowLeftNav }) => ({
  container: {
    backgroundColor: Colors.grey900,
    color: 'white',
    boxSizing: 'border-box',
    height: '100%',
    justifyContent: 'center',
    padding: Spacing.tiny + Spacing.micro,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    paddingTop: 4,
    maxWidth: '100%',
  },
  header: {
    // flexBasis: 100,
    flexShrink: 0,
    height: 56,
    alignItems: 'center',
  },
  leftNav: {
    flexBasis: LEFT_NAV_WIDTH,
    flexShrink: 0,
    [`@media(max-width: ${BreakPoints.tablet}px)`]: {
      marginLeft: tabletShowLeftNav ? 0 : -1 * (Spacing.small + LEFT_NAV_WIDTH),
      marginRight: Spacing.small,
    },
    paddingRight: Spacing.tiny + Spacing.micro,
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    flexGrow: 1,
  },
  page: {
    flexGrow: 1,
    maxWidth: '100%',
  },
})

export default Theme('App', defaultTheme)(App)
