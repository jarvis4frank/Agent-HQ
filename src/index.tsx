import React from 'react'
import { render, Box, Text } from 'ink'
import OfficeView from './components/OfficeView'

const App: React.FC = () => (
	<Box flexDirection="column">
		<OfficeView />
	</Box>
)

render(<App />)
