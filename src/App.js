import { Container, styled } from '@material-ui/core';

const OuterContainer = styled(Container)(({theme}) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}))

function App() {
  return (
    <OuterContainer>
    </OuterContainer>
  );
}

export default App;
