import { Grid, TextField, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import NumberInput from './NumberInput';
import { constrain } from './utils';

const minDegree = 0
const maxDegree = 10

function TFText({children}) {
  return (
    <Grid item>
      <Typography variant="body1" component="span">
        {children}
      </Typography>
    </Grid>
  )
}

function TFPowerOfS({power}) {
  if (power === 0) {
    return null
  } else {
    return <TFText><var>s</var>{power === 1 ? null : <sup>{power}</sup> }</TFText>
  }
}

function TFNumberInput(props) {
  return (<Grid item style={{height: 48}}><NumberInput {...props}/></Grid>)
}

function TFPoly(props) {
  const {degree, newScalar} = Object.assign({
    degree: 1,
    newScalar: () => {}
  }, props)

  return (
    <Grid item container spacing={1} style={{flexWrap: 'nowrap'}} justify='center' alignItems='center'>
      {[...Array(degree+1).keys()].reverse().map(power => (
        <React.Fragment key={power}>
          <TFNumberInput newInput={(val) => newScalar(power, val)}/>
          <TFPowerOfS power={power}/>
          {power === 0 ? null : <TFText>+</TFText>}
        </React.Fragment>
      ))}
    </Grid>
  )
}

function TFDegreeInput(props) {
  const {children, degreeString, setDegreeString, error} = Object.assign({
    children: null,
    degreeString: 1,
    setDegreeString: () => {},
    error: false
  }, props)

  const [forceError, setForceError] = useState(false)

  return (
    <Grid item container spacing={1} style={{flexWrap: 'nowrap'}} justify='flex-end' alignItems='center'>
      <TFText>
        {children}
      </TFText>
      <Grid item>
        <TextField
          type="number"
          variant="outlined"
          margin='dense'
          inputProps={{
            min: minDegree,
            max: maxDegree,
            step: 1
          }}
          style={{
            width: 80
          }}
          onInput={(e) => {
            const {target: {value, validity: {badInput}}} = e
            setForceError(badInput)
            setDegreeString(value)
          }}
          value={degreeString}
          error={error || forceError}
        />
      </Grid>
    </Grid>
  )
}

function parseDegreeString(degreeString) {
  const degAsNum = Number.parseInt(degreeString)
  const isNaN = Number.isNaN(degAsNum)
  const constrained = constrain(degAsNum, minDegree, maxDegree)
  return {
    value: isNaN ? minDegree : constrained,
    error: degreeString.length !== 0 && (isNaN || constrained !== degAsNum)
  }
}

function TFInput(props) {
  const {newTF, debounceTime} = Object.assign({
    newTF: () => {},
    debounceTime: 1000
  }, props)

  const [numDegreeString, setNumDegreeString] = useState('')
  const [denDegreeString, setDenDegreeString] = useState('')

  const {value: numDegValue, error: numDegError} = parseDegreeString(numDegreeString)
  const {value: denDegValue, error: denDegError} = parseDegreeString(denDegreeString)

  const [numerator, setNumerator] = useState([0])
  const [denominator, setDenominator] = useState([0])

  const useUpdatePolyDegree = (poly, setPoly, degree) => {
    useEffect(() => {
      const newPoly = poly.slice()
      newPoly.length = degree + 1
      for(let i = 0; i < newPoly.length; i++) {
        if(newPoly[i] === undefined) {
          newPoly[i] = 0
        }
      }
      setPoly(newPoly)
    // Should only fire when degree changes:
    // eslint-disable-next-line
    }, [degree])
  }
  useUpdatePolyDegree(numerator, setNumerator, numDegValue)
  useUpdatePolyDegree(denominator, setDenominator, denDegValue)

  const makeScalarUpdater = (poly, setPoly) => ((power, scalar) => {
    const newPoly = poly.slice()
    newPoly[power] = scalar
    setPoly(newPoly)
  })
  const numScalarUpdater = makeScalarUpdater(numerator, setNumerator)
  const denScalarUpdater = makeScalarUpdater(denominator, setDenominator)

  const [newTFTimeout, setNewTFTimeout] = useState(undefined)
  useEffect(() => {
    if(newTFTimeout !== undefined) {
      clearTimeout(newTFTimeout)
    }
    setNewTFTimeout(setTimeout(() => {
      newTF({
        num: numerator,
        den: denominator
      })
    }, debounceTime))
  // Should only fire when numerator or denominator change:
  // eslint-disable-next-line
  }, [numerator, denominator])

  return (
    <Grid container spacing={2} alignItems='center' justify='center'>
      <Grid item xs spacing={2} container style={{flexWrap: 'nowrap'}} justify='center' alignItems='center'>
        {/* <Grid item style={{height: 56}}>
          <NumberInput newInput={(inp)=>console.log(inp)}/>
        </Grid> */}
        <Grid item container style={{width: 'auto'}} direction='column' justify='center' alignItems='center'>
          <TFPoly degree={numDegValue} newScalar={numScalarUpdater}/>
          <Grid item style={{width: '100%'}}>
            <hr/>
          </Grid>
          <TFPoly degree={denDegValue} newScalar={denScalarUpdater}/>
        </Grid>
      </Grid>
      <Grid item container style={{maxWidth: 275}} spacing={2} direction='column' justify='center' alignItems='center'>
        <TFDegreeInput degreeString={numDegreeString} setDegreeString={setNumDegreeString} error={numDegError}>Numerator degree:</TFDegreeInput>
        <TFDegreeInput degreeString={denDegreeString} setDegreeString={setDenDegreeString} error={denDegError}>Denominator degree:</TFDegreeInput>
      </Grid>
    </Grid>
  )
}

export default TFInput