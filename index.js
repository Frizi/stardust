import compileShaders from './shaders'

const canvas = document.createElement('canvas')
document.body.appendChild(canvas)
const gl = canvas.getContext('webgl2')

const shaders = compileShaders(gl)

Object.assign(document.body.style, {
    margin: '0',
    padding: '0',
    overflow: 'hidden'
})

Object.assign(canvas.style, {
    position: 'absolute',
    width: '100%',
    height: '100%'
})

let width, height

window.addEventListener('resize', onResize, false)
onResize()

function onResize () {
    gl.canvas.width = width = innerWidth
    gl.canvas.height = height = innerHeight
    gl.viewport(0, 0, width, height);
}

const particleCount = 100000

let bufData = new Float32Array(particleCount * 6)

for (let i = 0; i < particleCount; i++) {
    let n = i * 6

    let r = Math.random() * 0.1
    let th = (Math.random() * Math.PI * 2)

    let r2 = r * 0.04//0.03 + Math.random() * 0.01
    let th2 = th + Math.PI / 2 + (Math.random() * 2 - 1) * 0.1 * Math.PI * 2

    let [x,y,z] = [
    //     n + 1,
    //     n + 2,
        Math.cos(th) * r,
        Math.sin(th) * r,
        0//(Math.random() * 2 - 1) * 0.2
    ]
    let [vx, vy, vz] = [
        Math.cos(th2) * r2,
        Math.sin(th2) * r2,
        0
    ]
    bufData[n + 0] = x
    bufData[n + 1] = y
    bufData[n + 2] = z
    bufData[n + 3] = vx
    bufData[n + 4] = vy
    bufData[n + 5] = vz
}

function makeProg (vert, frag) {
    const prog = gl.createProgram()
    if (vert) gl.attachShader(prog, vert)
    if (frag) gl.attachShader(prog, frag)
    return prog
}

function linkProg (prog) {
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("Error linking shaders:\n" + gl.getProgramInfoLog(prog));
    }
}

var integrateProg = makeProg(shaders.vert.integrate, shaders.frag.bypass)
gl.transformFeedbackVaryings(integrateProg, ["outPos", "outVel"], gl.INTERLEAVED_ATTRIBS )
linkProg(integrateProg)
const drawProg = makeProg(shaders.vert.offsetInstanced, shaders.frag.drawInstance);
linkProg(drawProg)

const bufferA = gl.createBuffer()
const bufferB = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, bufferA)
gl.bufferData(gl.ARRAY_BUFFER, bufData, gl.DYNAMIC_DRAW)
gl.bindBuffer(gl.ARRAY_BUFFER, null)

gl.bindBuffer(gl.ARRAY_BUFFER, bufferB)
gl.bufferData(gl.ARRAY_BUFFER, bufData, gl.DYNAMIC_DRAW)
gl.bindBuffer(gl.ARRAY_BUFFER, null)

const mesh = new Float32Array([
    -1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
    1.0, -1.0, 0.0,
    1.0,  1.0, 0.0,
])
var meshBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

var transformFeedback = gl.createTransformFeedback()
let pause = false

function integrate(particlesInBuf, particlesOutBuf) {
    gl.useProgram(integrateProg)
    const aPos = gl.getAttribLocation(integrateProg, "pos")
    const aVel = gl.getAttribLocation(integrateProg, "vel")

    gl.enableVertexAttribArray(aPos)
    gl.enableVertexAttribArray(aVel)

    gl.bindBuffer(gl.ARRAY_BUFFER, particlesInBuf)
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 4 * 6, 0)
    gl.vertexAttribPointer(aVel, 3, gl.FLOAT, false, 4 * 6, 4 * 3)
    gl.vertexAttribDivisor(aPos, 0);
    gl.vertexAttribDivisor(aVel, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback)
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, particlesOutBuf)

    gl.beginTransformFeedback(gl.POINTS)
    gl.drawArrays(gl.POINTS, 0, particleCount)
    gl.endTransformFeedback()

    // gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bufData)
    // console.log(bufData)

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null)

    gl.disableVertexAttribArray(aPos);
    gl.disableVertexAttribArray(aVel);
}

function draw(particleBuffer) {
    gl.useProgram(drawProg)
    const aVertexPos = gl.getAttribLocation(drawProg, "vertexPos")
    const aInstanceOffset = gl.getAttribLocation(drawProg, "instanceOffset")
    const aInstanceVelocity = gl.getAttribLocation(drawProg, "instanceVelocity")
    const uResolution = gl.getUniformLocation(drawProg, "resolution");

    gl.enableVertexAttribArray(aVertexPos)
    gl.enableVertexAttribArray(aInstanceOffset)
    gl.enableVertexAttribArray(aInstanceVelocity)

    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.vertexAttribPointer(aInstanceOffset, 3, gl.FLOAT, false, 4 * 6, 0)
    gl.vertexAttribPointer(aInstanceVelocity, 3, gl.FLOAT, false, 4 * 6, 4 * 3)
    gl.vertexAttribDivisor(aInstanceOffset, 1);
    gl.vertexAttribDivisor(aInstanceVelocity, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
    gl.vertexAttribPointer(aVertexPos, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(uResolution, width, height);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, particleCount);
    gl.disableVertexAttribArray(aVertexPos);
    gl.disableVertexAttribArray(aInstanceOffset);
    gl.disableVertexAttribArray(aInstanceVelocity);
}

function frame (particlesInBuf, particlesOutBuf) {
    if (!pause) {
        integrate(particlesInBuf, particlesOutBuf);
    }
    draw(particlesOutBuf);
}

let frontBuf = bufferA
let backBuf = bufferB
function swapBuf () {
    [frontBuf, backBuf] = [backBuf, frontBuf]
}

requestAnimationFrame(function tick() {
    frame(frontBuf, backBuf)
    swapBuf()
    requestAnimationFrame(tick)
})

document.addEventListener('keypress', e => {
    switch (e.key) {
        case ' ':
            pause = !pause
            return
    }
})
