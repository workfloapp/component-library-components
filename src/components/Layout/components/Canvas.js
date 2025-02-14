import React from 'react'
import Panel from '../../Panel'
import PanelHeader from '../../PanelHeader'
import PanelContent from '../../PanelContent'
import Column from './Column'

type PropsT = {
  children: React.Element,
  header: React.Element,
  isFullscreen: boolean,
}

/** Helper component for rendering flexbox row w/ semantically meaninful markup */
const Canvas = ({ children, isFullscreen, header, ...props }: PropsT) => {
  if (isFullscreen)
    return (
      <Column style={{ flexGrow: 1 }}>
        {children}
      </Column>
    )
  return (
    <Panel
      {...props}
      header={
        <PanelHeader>
          {header}
        </PanelHeader>
      }
      content={
        <PanelContent>
          {children}
        </PanelContent>
      }
    />
  )
}

export default Canvas
