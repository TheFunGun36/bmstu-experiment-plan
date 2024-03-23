export class Rayleigh {
  sigma: number;

  constructor(sigma: number) {
    this.sigma = sigma;
  }

  get() {
    return Math.sqrt(-2 * this.sigma * this.sigma * Math.log(1 - Math.random()));
  }
}
