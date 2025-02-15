import * as THREE from 'three'

import { Component } from "./Component";

export class CombatComponent extends Component {
    constructor(params) {
        super();
        this.damage = params.damage || 10;
        this.range = params.range || 2;
        this.cooldown = params.cooldown || 1.0;
        this.currentCooldown = 0;
    }

    canAttack() {
        return this.currentCooldown <= 0;
    }

    startAttack() {
        this.currentCooldown = this.cooldown;
    }

    update(deltaTime) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= deltaTime;
        }
    }
}