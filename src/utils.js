export const constrain = (v, min, max) => v < min ? min : (v > max ? max : v)

export const arange = (start, end) => Array.from({length: (end - start)}, (v, k) => k + start);

export const newYield = () => new Promise((resolve) => {
  setTimeout( function() {
    resolve()
  }, 1)
})

export const newLogBase = (base) => {
  const scalar = 1 / Math.log(base)
  return (v) => scalar * Math.log(v) 
}