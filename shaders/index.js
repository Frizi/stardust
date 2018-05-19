const allShadersContext = require.context('webpack-glsl-loader!./', false, /\.(vert|frag)\.glsl$/)
const nameRe = /^\.\/(.*?)\.(vert|frag).glsl$/

export default (gl) => allShadersContext.keys().reduce((shaders, thisShader) => {
    const [type, ccName, shader] = load(thisShader, gl)
    shaders[type][ccName] = shader
    return shaders
}, {vert: {}, frag: {}})

function load(thisShader, gl) {
    const [,name, ext] = thisShader.match(nameRe)

    let [first, ...rest] = name.split('-')
    let ccName = [first, ...rest.map(n => n[0].toUpperCase() + n.substr(1))].join('')

    const shaderTypeGl = ({
            'vert': gl.VERTEX_SHADER,
            'frag': gl.FRAGMENT_SHADER
    })[ext]

    if (shaderTypeGl == null) {
        throw new Error(`Unknown shader type ${shaderType}`)
    }
    const shader = compile(thisShader, allShadersContext(thisShader), shaderTypeGl, gl)
    return [ext, ccName, shader]
}

function compile(id, src, shaderType, gl) {
    const shader = gl.createShader ( shaderType );
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        let log = gl.getShaderInfoLog(shader)
        console.error(`Shader ${id} compilation error:\n${log}`)
    }
    return shader
}
