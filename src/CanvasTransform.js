import { complexAdd, complexSubtract, elementDiv, elementMult, evalTF, scalarDiv, scalarMult } from './tf_math'
import { arange } from './utils'

class CanvasTransform {
  constructor(center, scale) {
    this.center = center
    this.scale = scale
  }

  createTransforms(canvasSize, canvasOffset) {
    // to:
    // o = (p-c)*s + cs/2 + co
    // o = ps - cs + cs/2 + co

    // from:
    // o = ((p - co - cs/2) / s) + c
    // o = p/s  -  (co + cs/2)/s + c
    const totalOffset = complexAdd(canvasOffset, scalarDiv(2, canvasSize))
    const flippedScale = elementMult(this.scale, [1, -1])

    const toCOff = complexSubtract(totalOffset, elementMult(this.center, flippedScale))
    const fromCOff = complexSubtract(this.center, elementDiv(totalOffset, flippedScale))

    return {
      toCanvas: p => complexAdd(elementMult(p, flippedScale), toCOff),
      fromCanvas: p => complexAdd(elementDiv(p, flippedScale), fromCOff)
    }
  }
}

export function autoscaleSPlane(canvasSize, points) {
  if(points.length >= 1) {
    const bl = [-1, -1]
    const tr = [1, 1]

    for(let point of points) {
      bl[0] = Math.min(bl[0], point[0])
      bl[1] = Math.min(bl[1], point[1])
      tr[0] = Math.max(tr[0], point[0])
      tr[1] = Math.max(tr[1], point[1])
    }

    const center = complexAdd(scalarMult(0.5, bl), scalarMult(0.5, tr))
    const scale = scalarMult(0.33, elementDiv(canvasSize, complexSubtract(tr, bl)))
    return new CanvasTransform(center, scale)
  }else {
    const scale = Math.min(canvasSize[0], canvasSize[1])/4
    return new CanvasTransform([0, 0], [scale, scale])
  }
}

export function autoscaleOutputPlane(canvasSize, tf) {
  let points = []
  if (tf) {
    points = arange(-1000, 1000)
      .map(p => evalTF(tf, [0, 0.1*p]))
      .filter(([a, b]) => !(Number.isNaN(a) || Number.isNaN(b)))
  }
  return autoscaleSPlane(canvasSize, points)
}