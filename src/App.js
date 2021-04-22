import { Container, Grid, hslToRgb, styled, useTheme } from '@material-ui/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TFInput from './TFInput';
import {autoscaleOutputPlane, autoscaleSPlane} from './CanvasTransform';
import { elementDiv, elementMult, evalTF, findRoots, mag} from './tf_math';
import { arange, constrain, newLogBase, newYield } from './utils';
import { blue } from '@material-ui/core/colors';

const axisSize = 32

function App() {
  const [tf, setTF] = useState(undefined)
  const zeros = useMemo(() => tf? findRoots(tf.num) : [], [tf])
  const poles = useMemo(() => tf? findRoots(tf.den) : [], [tf])



  const theme = useTheme()

  const canvasDim = Math.round(theme.breakpoints.values.md / 2) - theme.spacing(6)

  const inputCanvas = useRef();
  const outputCanvas = useRef();

  const inputPlotSize = useMemo(() => [canvasDim - axisSize, canvasDim - axisSize], [canvasDim])
  const outputPlotSize = inputPlotSize

  const inputPlotScale = useMemo(() => autoscaleSPlane(inputPlotSize, [...zeros, ...poles]), [inputPlotSize, zeros, poles])
  const outputPlotScale = useMemo(() => autoscaleOutputPlane(outputPlotSize, tf), [outputPlotSize, tf])




  const outputColorer = useCallback((point) => {
    const scaled = elementDiv(elementMult(point, outputPlotScale.scale), outputPlotSize)
    const cmag = magColorScale(mag(scaled))
    const cangle = 180 + (Math.atan2(scaled[1], scaled[0]) * 180 / Math.PI)
    // console.log('color', mag, angle)
    
    return hsl2rgba(cangle, 1, cmag)
  }, [outputPlotScale.scale, outputPlotSize])

  const inputColorer = useCallback((point) => {
    if(tf) {
      const outputPoint = evalTF(tf, point)
      if(!(Number.isNaN(outputPoint[0]) || Number.isNaN(outputPoint[1]))) {
        return outputColorer(outputPoint)
      }
    }

    return [150, 150, 150, 255]
    
  }, [tf, outputColorer])



  const [hoverIn, setHoverIn] = useState(undefined);
  const hoverOut = useMemo(() => {
    if(hoverIn && tf) {
      const out = evalTF(tf, hoverIn)
      if(!(Number.isNaN(out[0]) || Number.isNaN(out[1]))) {
        return out
      }
    }
  }, [hoverIn, tf])
  
  const mouseOut = useCallback((e) => {
    setHoverIn(undefined)
  }, [setHoverIn])

  const mouseMove = useCallback((e) => {
    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const {fromCanvas} = inputPlotScale.createTransforms(inputPlotSize, [axisSize, 0])

    setHoverIn(fromCanvas([x, y]))
  }, [setHoverIn, inputPlotScale, inputPlotSize])




  const nyquistPoints = useMemo(() => {
    if(tf){
      console.log('starting nyq')
      const out = arange(-10000, 10000)
        .map(v => evalTF(tf, [0, v*0.01]))
        .filter(([a, b]) => !(Number.isNaN(a) || Number.isNaN(b)))
      console.log('completed nyq')
      return out
    }
  }, [tf])



  const inputBackground = useAsyncBackgroundRender(canvasDim, inputPlotSize, inputPlotScale, inputColorer)
  const outputBackground = useAsyncBackgroundRender(canvasDim, outputPlotSize, outputPlotScale, outputColorer)

  useRenderCanvas(inputCanvas, canvasDim, inputPlotSize, inputPlotScale, {poles, zeros, background: inputBackground, hoverIn})
  useRenderCanvas(outputCanvas, canvasDim, outputPlotSize, outputPlotScale, {background: outputBackground, hoverOut, nyquistPoints})


  

  return (
    <Container>
      <Grid container direction='column' justify='space-between' style={{minHeight: '100vh', paddingTop: theme.spacing(4), paddingBottom: theme.spacing(4)}}>
        <Grid item>
          <TFInput newTF={setTF}/>
        </Grid>

        <Grid item xs container spacing={2}>
          <Grid item xs={12} md={6} style={{textAlign: 'center'}}>
            <canvas width={canvasDim} height={canvasDim} ref={inputCanvas} onMouseOut={mouseOut} onMouseMove={mouseMove}/>
          </Grid>
          <Grid item xs={12} md={6} style={{textAlign: 'center'}}>
            <canvas width={canvasDim} height={canvasDim} ref={outputCanvas}/>
          </Grid>
        </Grid>

        <Grid item style={{paddingTop: theme.spacing(4)}}>
          Controls

          <br/>
          <br/>
          <br/>
          <br/>
          wef
          wfe
          <br/>
          <br/>
          <br/>
          <br/>

          wef
        </Grid>
      </Grid>
    </Container>
  );
}

function pickAxisLabels(oneDFromCanvas, oneDToCanvas, pxOfLower, pxOfUpper) {
  const lowerS = oneDFromCanvas(pxOfLower)
  const upperS = oneDFromCanvas(pxOfUpper)
  const diffS = upperS - lowerS

  // Math and constants determined experimentally: https://www.desmos.com/calculator/ro3jdmeoha
  let stepSize = Math.pow(10, Math.floor(Math.log10(diffS) - 0.65))

  const stepsInRange = diffS / stepSize

  if(stepsInRange > 22) {
    stepSize *= 5
  }else if(stepsInRange > 9) {
    stepSize *= 2.5
  }

  const start = stepSize * Math.ceil(lowerS / stepSize)

  const out = []
  for(let i = 0; start + (i*stepSize) < upperS; i++) {
    const label = start + (i*stepSize)
    out[i] = {
      label,
      px: oneDToCanvas(label)
    }
  }

  return out
}

function hsl2rgba(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return 255 * color;
  };
  return [f(0), f(8), f(4), 255];
}

const magColorScale = (() => {
  const log = newLogBase(15)
  return (v) => 0.35 * (1-log(v + 0.01))
})()

function useAsyncBackgroundRender(canvasDim, inputPlotSize, inputPlotScale, colorer) {
  const [background, setBackground] = useState(undefined)
  const [cancelRender, setCancelRender] = useState(undefined)

  useEffect(() => {
    if(cancelRender) {
      cancelRender()
    }

    setCancelRender(() => 
      asyncBackgroundRender(setBackground, canvasDim, inputPlotSize, inputPlotScale, colorer)
    )
  }, [canvasDim, inputPlotSize, inputPlotScale, colorer])

  return background
}

function asyncBackgroundRender(setBackground, canvasDim, plotSize, plotScale, colorer) {
  const abortController = new AbortController();

  (async (abortSignal) => {
    setBackground(new ImageData(canvasDim, canvasDim))

    console.log('started render')

    const imageData = new ImageData(canvasDim, canvasDim)
    const getOffset = (x, y) => 4*(x + (y*imageData.width))

    const {fromCanvas} = plotScale.createTransforms(plotSize, [axisSize, 0])
    
    for(let i = axisSize; i < canvasDim; i++) {
      for(let j = 0; j < plotSize[1]; j++) {
        const color = colorer(fromCanvas([i, j]))

        const offset = getOffset(i, j)
        imageData.data[offset    ] = color[0]
        imageData.data[offset + 1] = color[1]
        imageData.data[offset + 2] = color[2]
        imageData.data[offset + 3] = color[3]
      }
      if(abortSignal.aborted) {
        return
      }
      await newYield()
    }

    if(!abortSignal.aborted) {
      console.log('completed render')
      setBackground(imageData)
    }else {
      console.log('render canceled')
    }
  })(abortController.signal);
  return () => {
    console.log('cancelling render', abortController)
    abortController.abort()
  }
}

function useRenderCanvas(...args) {
  useEffect(() => {
    renderCanvas(...args)
  }, [...args])
}

function renderCanvas(canvasRef, canvasDim, plotSize, plotScale, toRender) {
  const {zeros, poles, background, hoverIn, hoverOut, nyquistPoints} = Object.assign({
    zeros: [],
    poles: []
  }, toRender)

  if(canvasRef.current && canvasRef.current.getContext) {
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2
    ctx.clearRect(0, 0, canvasDim, canvasDim)

    const {toCanvas, fromCanvas} = plotScale.createTransforms(plotSize, [axisSize, 0])

    // --- Background Coloring ---
    if(background) {
      ctx.putImageData(background, 0, 0)
    }


    if(hoverIn) {
      ctx.strokeStyle = 'white';
      ctx.beginPath()
      zeros.forEach(zero => {
        const [x1, y1] = toCanvas(zero)
        const [x2, y2] = toCanvas(hoverIn)
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      })
      ctx.stroke()


      ctx.strokeStyle = 'black';
      ctx.beginPath()
      poles.forEach(pole => {
        const [x1, y1] = toCanvas(pole)
        const [x2, y2] = toCanvas(hoverIn)
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
      })
      ctx.stroke()
    }
    

    // --- Dots ---
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    zeros.forEach(zero => {
      const [x, y] = toCanvas(zero)
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x, y, 4, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    })

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    poles.forEach(pole => {
      const [x, y] = toCanvas(pole)
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x - 4, y - 4)
      ctx.lineTo(x + 4, y + 4)
      ctx.moveTo(x - 4, y + 4)
      ctx.lineTo(x + 4, y - 4)
      ctx.stroke()
    })


    ctx.fillStyle = 'black';
    const renderHover = (p) => {
      const [x, y] = toCanvas(p)
      // ctx.strokeRect(x - 4, y - 4, 8, 8)
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if(hoverIn) {
      renderHover(hoverIn)
    }
    if(hoverOut) {
      renderHover(hoverOut)
    }




    if(nyquistPoints && nyquistPoints.length >= 1) {
      ctx.strokeStyle = 'black'
      ctx.beginPath()
      ctx.moveTo(...toCanvas(nyquistPoints[0]))
      for(let point of nyquistPoints) {
        ctx.lineTo(...toCanvas(point))
      }
      ctx.lineTo(...toCanvas(nyquistPoints[0]))
      ctx.stroke()
    }
    
    


    // --- Axis Labels ---
    ctx.fillStyle = 'black'
    ctx.strokeStyle = 'black';
    ctx.font = '16px Roboto'

    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    const sigmaLabels = pickAxisLabels(v => fromCanvas([v, 0])[0], v => toCanvas([v, 0])[0], axisSize, canvasDim - 1)
    sigmaLabels.forEach(({label, px}) => {
      ctx.fillText(`${label}`, px, plotSize[1] + 4);
      ctx.beginPath()
      ctx.moveTo(px, plotSize[1])
      ctx.lineTo(px, plotSize[1]-5)
      ctx.stroke()
    })

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const omegaLabels = pickAxisLabels(v => fromCanvas([0, v])[1], v => toCanvas([0, v])[1], plotSize[1]-1, 0)
    omegaLabels.forEach(({label, px}) => {
      ctx.fillText(`${label}`, axisSize - 4, px);
      ctx.beginPath()
      ctx.moveTo(axisSize, px)
      ctx.lineTo(axisSize + 5, px)
      ctx.stroke()
    })
  }
}

export default App;