import durandKerner from 'durand-kerner';


export function findRoots(poly) {
  const [reals, imags] = durandKerner(stripHighZeros(poly))
  return reals? reals.map((real, ind) => ([real, imags[ind]])) : []
}

export function stripHighZeros(poly) {
  poly = poly.slice()

  let beginningOfZeros = poly.length

  for(let i = poly.length - 1; i >= 0; i--) {
    if(poly[i] !== 0) {
      break;
    }else {
      beginningOfZeros = i
    }
  }

  poly.length = beginningOfZeros;

  return poly
}




export function complexAdd([a, b], [c, d]) {
  return [a+c, b+d]
}

export function complexSubtract([a, b], [c, d]) {
  return [a-c, b-d]
}

export function scalarMult(s, [a, b]) {
  return [s*a, s*b]
}

export function scalarDiv(s, c) {
  return scalarMult(1/s, c)
}

export function complexMult([a, b], [c, d]) {
  return [(a*c) - (b*d), (b*c) + (a*d)]
}

export function complexDiv(num, [c, d]) {
  return scalarDiv((c*c) + (d*d), complexMult(num, [c, -d]))
}

export function evalPoly(poly, s) {
  let res = [0, 0]

  let sToPower = [1, 0]
  for(let i in poly) {
    res = complexAdd(res, scalarMult(poly[i], sToPower))
    sToPower = complexMult(sToPower, s)
  }

  return res
}

export function evalTF(tf, s) {
  return complexDiv(evalPoly(tf.num, s), evalPoly(tf.den, s))
}



export function elementMult([a, b], [c, d]) {
  return [a*c, b*d]
}

export function elementDiv([a, b], [c, d]) {
  return [a/c, b/d]
}



export function mag(s) {
  const [a, b] = elementMult(s, s)
  return a+b
}