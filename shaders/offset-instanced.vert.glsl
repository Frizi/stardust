#version 300 es

precision mediump float;

uniform vec2 resolution;

in vec3 vertexPos;
in vec3 instanceOffset;
in vec3 instanceVelocity;

flat out int instance;
out vec2 texPos;

void main () {
    float ratio = resolution.x / resolution.y;

    instance = gl_InstanceID;
    texPos = vertexPos.xy;
    vec3 pos = vertexPos;
    pos.y *= ratio;
    pos *= 0.01;
    vec3 offset = instanceOffset;

    float vel = sqrt(dot(instanceVelocity, instanceVelocity));
    pos *= 0.5 + (1.0 - vel) * 0.1;
    offset.y *= ratio;
    vec3 finalVal = pos + offset;

    gl_Position = vec4(finalVal, 1.0);
}
