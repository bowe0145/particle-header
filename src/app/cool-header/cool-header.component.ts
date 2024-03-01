import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';

type Star = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
};

// This requires a parent element
@Component({
  selector: 'app-cool-header',
  standalone: true,
  imports: [],
  templateUrl: './cool-header.component.html',
  styleUrl: './cool-header.component.scss',
})
export class CoolHeaderComponent {
  // Set the default values for the stars
  @Input() starCount: number = 100;
  @Input() FPS: number = 15;
  @Input() connectionRange: number = 120;
  @Input() connectionBaseWidth: number = 0.005;
  @Input() starSpeed: number = 0.05;
  @Input() transparency: number = 0.3;

  // Connect to the canvas child component in this angular component
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.resizeCanvas(event.target.innerWidth);
  }

  private context!: CanvasRenderingContext2D;
  private lastWidth: number = 0;
  private lastHeight: number = 0;
  private lastTime: number = 0;
  private timeSinceLastPop: number = 0;
  private desiredTransparency: number = 0;
  private frameCount: number = 0;
  private wantToRemove: number[] = [];

  private stars: Star[] = [];



  ngAfterViewInit() {
    if (!this.canvas) return;
    if (!this.canvas.nativeElement.parentElement) return; // Going to require a container

    this.context = this.canvas.nativeElement.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    // Setup the canvas
    this.resizeCanvas();
    this.stars = Array(this.starCount);
    this.setupStars();
    console.log(this.stars[0])

    setTimeout(() => {
      console.log("Fading in", this.lastTime)
      this.fadeIn();
    }, 1000);

    requestAnimationFrame((newTime) => this.mainLoop(newTime));
  }

  fadeIn() {
    const timeToFadeIn = 5;
    if (this.desiredTransparency < 1) {
      this.desiredTransparency += 1 / timeToFadeIn;

      setTimeout(() => {
        this.fadeIn();
      }, 100);
    } else {
      console.log("Done fading in", this.lastTime)
    }
  }

  resizeCanvas(width?: number): void {
    if (width) {
      if (this.lastWidth === width) return;

      this.context.canvas.width = width;
      return;
    }

    if (!this.canvas.nativeElement.parentElement) return;
    const parentWidth = this.canvas.nativeElement.parentElement.offsetWidth;
    // We actually do care about the height, but only for like the first render
    const parentHeight = this.canvas.nativeElement.parentElement.offsetHeight;

    if (parentWidth === this.lastWidth && parentHeight === this.lastHeight)
      return;

    this.context.canvas.width = parentWidth;
    this.context.canvas.height = parentHeight;

    this.lastWidth = parentWidth;
    this.lastHeight = parentHeight;
  }

  setupStars(): void {
    if (!this.canvas.nativeElement.parentElement) return;

    const parentWidth = this.canvas.nativeElement.parentElement.offsetWidth;
    const parentHeight = this.canvas.nativeElement.parentElement.offsetHeight;

    const aspectRatio = parentWidth / parentHeight;

    const baseVelocity = this.starSpeed;

    let maxVelocityX = parentWidth * baseVelocity;
    let maxVelocityY = parentHeight * baseVelocity;

    // Scale based on aspect ratio
    if (aspectRatio > 1) {
      maxVelocityY *= aspectRatio;
    } else {
      maxVelocityX /= aspectRatio;
    }

    for (let i = 0; i < this.starCount; i++) {
      const star: Star = {
        x: Math.random() * this.context.canvas.width,
        y: Math.random() * this.context.canvas.height,
        radius: Math.random() * 1.5 + 1.5,
        vx: Math.random() * 2 * maxVelocityX - maxVelocityX,
        vy: Math.random() * 2 * maxVelocityY - maxVelocityY,
      };

      this.stars[i] = star;
    }
  }

  mainLoop(time: number = 0): void {
    // console.log("Mainloop");
    if (time === 0) {
      console.log("time is 0")
      this.lastTime = performance.now();
      requestAnimationFrame((newTime) => this.mainLoop(newTime));
      return;
    }

    // Calculate the time passed
    const elapsed = time - this.lastTime;
    this.lastTime = time;

    if (this.desiredTransparency < 1) {
      this.frameCount++;
    }

    if (elapsed > 1000 / this.FPS && this.frameCount > 5 && this.desiredTransparency <= 0.3) {
      this.timeSinceLastPop += elapsed;

      const shouldPop = (elapsed / (1000 / this.FPS) | 0);
      this.wantToRemove.push(shouldPop);

      // console.log("After", this.stars.length)
    }

    const avgRemove = this.wantToRemove.reduce((a, b) => a + b, 0) / this.wantToRemove.length | 0;
    const maxRemove = Math.max(...this.wantToRemove);
    if (maxRemove > 0 && this.desiredTransparency >= 0.3 && this.desiredTransparency <= 0.5) {
      console.log("avgRemove", avgRemove, "maxRemove", maxRemove)
      console.log(this.wantToRemove.length)
      for (let i = 0; i < avgRemove; i++) {
        this.stars.pop();
      }

      this.wantToRemove = [];
      console.log("After", this.stars.length)
    }
    this.clearCanvas();

    for (let i = 0; i < this.stars.length; i++) {
      this.update(i, elapsed);
      this.paint(i);
    }

    // console.log("Elapsed", elapsed);

    // Run the main loop only if the time passed is bigger than the FPS
    // if (elapsed > 1000 / this.FPS) {
    //   // console.log("Looping");
    //   this.lastTime = time;
    //   this.clearCanvas();

    //   for (let i = 0; i < this.stars.length; i++) {
    //     this.update(i, elapsed);
    //     this.paint(i);
    //   }
    // }

    requestAnimationFrame((newTime) => this.mainLoop(newTime));

    // if (this.counter > 5) {
    //   console.log("FPS", 1000 / delta)
    //   console.log("time", time);
    //   console.log("lastTime", this.lastTime);
    //   console.log("delta", delta);
    //   console.log("this.fps", this.FPS);
    //   debugger;
    // }
    // this.lastTime = time;
    // // console.log(delta);
    // this.clearCanvas();

    // for (let i = 0; i < this.stars.length; i++) {
    //   this.update(i, elapsed);
    //   this.paint(i);
    // }

    // requestAnimationFrame((newTime) => this.mainLoop(newTime));
  }

  getConnectionWidth(distance: number): number {
    return this.connectionBaseWidth + (1 - distance / this.connectionRange) * 1;
  }

  clearCanvas(): void {
    this.context.clearRect(
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height
    );

    this.context.globalCompositeOperation = 'lighten';
    this.context.globalAlpha = 0.3;
  }

  calculateDistance(star1: Star, star2: Star): number {
    const dx = star1.x - star2.x;
    const dy = star1.y - star2.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  drawLine(star1: Star, star2: Star, width: number): void {
    this.context.beginPath();
    this.context.moveTo(star1.x, star1.y);
    this.context.lineTo(star2.x, star2.y);
    this.context.lineWidth = width;
    this.context.strokeStyle = `rgba(255, 255, 255, ${this.desiredTransparency})`;
    this.context.stroke();
  }

  update(index: number, delta: number): void {
    this.updateStar(this.stars[index], delta);
  }

  paint(index: number): void {
    // Paint the dot
    this.paintStar(this.stars[index]);

    // Loop through the other stars (only the ones that haven't been connected yet)
    // To prevent double connections
    const star1 = this.stars[index];
    for (let i = index + 1; i < this.stars.length; i++) {
      const star2 = this.stars[i];
      const distance = this.calculateDistance(star1, star2);
      if (distance < this.connectionRange) {
        const width = this.getConnectionWidth(distance);
        // Paint the connecting line
        this.drawLine(star1, star2, width);
      }
    }
  }

  paintStar(star: Star): void {
    this.context.fillStyle = `rgba(255, 255, 255, ${this.desiredTransparency})`;
    this.context.beginPath();
    this.context.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    this.context.fill();
  }

  updateStar(star: Star, delta: number): void {
    // if (!delta) return;
    // Move the star based on its velocity and the time passed
    // star.x += star.vx / (delta / 1000);
    // star.y += star.vy / (delta / 1000);
    star.x += star.vx / this.FPS;
    star.y += star.vy / this.FPS;
    // console.log("I want to move", star.x, star.vx, this.FPS, star.vx / this.FPS)
    // console.log("Using FPS", star.x, star.vx, delta, star.vx / (1000 / delta))

    // debugger;

    // Check if it should bounce
    if (star.x < 0 || star.x > this.context.canvas.width) {
      star.vx = -star.vx;
    }

    if (star.y < 0 || star.y > this.context.canvas.height) {
      star.vy = -star.vy;
    }
  }
}
