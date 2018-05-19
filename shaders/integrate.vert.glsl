#version 300 es

precision highp float;

in vec3 pos;
in vec3 vel;

out vec3 outPos;
out vec3 outVel;

void main () {
    // vec3 acc = vec3(0.0, -0.0001, 0.0);
    float d2 = dot(pos, pos);
    float d = sqrt(d2);
    // float force = min(0.001, 0.0000001 / d2);

    vec3 acc = -(pos / d) / max(0.001,d2);

    outVel = vel + acc * 0.000001;
    outPos = pos + outVel;
    // outVel = vel;
    // outPos = pos;
}
