#version 300 es

precision mediump float;

out vec4 outColor;

flat in int instance;
in vec2 texPos;

void main () {
    float i = float(instance) * 0.1;
    float d = 1.0 - min(dot(texPos, texPos), 1.0);
    float dd = d * d * d * d;
    outColor = vec4(0.3, mod(i, 1.0), 1.0, dd);
}
