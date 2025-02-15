import { Component } from "./Component";
import * as THREE from 'three'


export class HealthComponent extends Component {
    constructor(params = {}) {
        super();
        this.maxHealth = params.maxHealth || 100;
        this.currentHealth = this.maxHealth;
        this.invulnerableTime = params.invulnerableTime || 0.5;
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;
    }

    canTakeDamage() {
        return !this.isInvulnerable && this.currentHealth > 0;
    }

    takeDamage(amount) {
        if (!this.canTakeDamage()) return;

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.startInvulnerability();

        if (this.currentHealth <= 0) {
            this.entity.emit('health.zero');
        }
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    startInvulnerability() {
        this.isInvulnerable = true;
        this.invulnerableTimer = this.invulnerableTime;
    }

    update(deltaTime) {
        if (this.isInvulnerable) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
    }
}
