import { OutlinedInput } from '@material-ui/core';
import React, { useEffect, useState } from 'react';

function NumberInput(props) {
  const {newInput, notifyInitial} = Object.assign({
    newInput: ()=>{},
    notifyInitial: true
  }, props)

  const [valid, setValid] = useState(true);
  const [input, setInput] = useState(0);

  // If desired, call the callback with the initial value of the input.
  useEffect(() => {
    if(notifyInitial) {
      newInput(input);
    }
    // eslint-disable-next-line
  }, []);

  return (
    <OutlinedInput
      margin='dense'
      error={!valid}
      inputComponent='span'
      inputProps={{
        contentEditable: true,
        value: "foo",
        onBeforeInput:(e) => {
          if(/[^-\d.]/.test(e.data)) {
            e.preventDefault()
          }
        },
        onInput: ({target: {innerText}}) => {
          if('' === innerText) {
            setValid(true)
            if(input !== 0) {
              setInput(0)
              newInput(0)
            }
          }else {
            const parsed = Number.parseFloat(innerText)
            if(!Number.isNaN(parsed) && atMostOne(innerText, '.') && atMostOne(innerText, '-') && innerText.indexOf('-') < 1) {
              setValid(true)
              if(input !== parsed) {
                setInput(parsed)
                newInput(parsed)
              }
            }else {
              setValid(false)
            }
          }
        }}
      }
    />
  );
}

function atMostOne(str, target) {
  return str.indexOf(target) === str.lastIndexOf(target) 
}

export default NumberInput;