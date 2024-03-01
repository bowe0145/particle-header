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

@Component({
  selector: 'star-particles',
  standalone: true,
  templateUrl: './star-particles.component.html',
  styleUrls: ['./star-particles.component.scss'],
})
export class StarParticlesComponent {
  // This is essentially 100 = 100%
  @Input() starDensity = 100;
  @Input() FPS: number = 60;
  // This is also a percentage
  @Input() connectionRange: number = 100;
  @Input() connectionBaseWidth: number = 0.5;
  @Input() starSpeed: number = 0.00002;
  @Input() transparency: number = 0.3;
  @Input() starColour: string = '#FFF';
  // TODO: Use this
  @Input() connectionColour: string = '#FFF';

  // Connect the canvas element to the component
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement> | null = null;

  private resizeObserver: ResizeObserver | null = null;

  // TODO: Typing of event
  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.resizeCanvas(event.target.innerWidth);
  }

  private context: CanvasRenderingContext2D | null = null;
  private lastWidth: number = 0;
  private lastHeight: number = 0;
  private stars: Star[] = [];
  private lastTime: number = 0;
  private adjustedStarCount: number = 0;
  private adjustedStarRange: number = 0;

  ngAfterViewInit() {
    // Require a canvas
    if (!this.canvas) return;
    // Require a parent element
    if (!this.canvas.nativeElement.parentElement) return;

    // Get the canvas context
    this.context = this.canvas.nativeElement.getContext('2d');
    if (!this.context) return;

    // Setup the canvas
    this.setupResizeObserver();
    this.resizeCanvas(); // This uses the container size

    // Create the stars
    this.instantiateStars();

    // Start the animation
    requestAnimationFrame((newTime) => this.animate(newTime));
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver() {
    if (!this.canvas) return;
    if (!this.canvas.nativeElement.parentElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });

    this.resizeObserver.observe(this.canvas.nativeElement.parentElement);
  }

  resizeCanvas(width?: number): void {
    if (width) {
      if (this.lastWidth === width) return;
      if (!this.context) return;

      this.context.canvas.width = width;
      return;
    }

    // Require a canvas and parent
    if (!this.canvas) return;
    if (!this.canvas.nativeElement.parentElement) return;

    const parentWidth = this.canvas.nativeElement.parentElement.offsetWidth;
    // We actually do care about the height, but only for like the first render
    const parentHeight = this.canvas.nativeElement.parentElement.offsetHeight;

    // Skip the resize if the size is the same
    if (parentWidth === this.lastWidth && parentHeight === this.lastHeight)
      return;

    // Require a context
    if (!this.context) return;

    // Update the canvas size to match the parent
    this.context.canvas.width = parentWidth;
    this.context.canvas.height = parentHeight;

    // Update the last size so we can skip the resize if it's the same
    this.lastWidth = parentWidth;
    this.lastHeight = parentHeight;
  }

  calculateMaxVelocity(): { maxVelocityX: number; maxVelocityY: number } {
    if (!this.canvas) return { maxVelocityX: 0, maxVelocityY: 0 };
    if (!this.canvas.nativeElement.parentElement)
      return { maxVelocityX: 0, maxVelocityY: 0 };

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

    return { maxVelocityX, maxVelocityY };
  }

  // Linear Interpolation
  interpolate(
    x: number,
    x0: number,
    x1: number,
    y0: number,
    y1: number
  ): number {
    return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
  }

  adjustStarSettings(
    width: number,
    height: number
  ): { num: number; range: number } {
    const area = width * height;

    // The density and ranges are based on what looks ideal, for breakpoints in the css
    // { screen area, pixels per star, range in pixels}
    const dataPoints = [
      { area: 320 * 355, density: 2270, range: 75 },
      { area: 425 * 355, density: 2515, range: 75 },
      { area: 768 * 355, density: 3490, range: 90 },
      { area: 1024 * 318, density: 3618, range: 100 },
      { area: 1450 * 318, density: 4828, range: 130 },
    ];

    // Sort data points by area to ensure correct interpolation order
    dataPoints.sort((a, b) => a.area - b.area);

    // Find the two points between which we'll interpolate
    let lower = dataPoints[0];
    let upper = dataPoints[dataPoints.length - 1];
    for (let i = 0; i < dataPoints.length - 1; i++) {
      if (area >= dataPoints[i].area && area <= dataPoints[i + 1].area) {
        lower = dataPoints[i];
        upper = dataPoints[i + 1];
        break;
      }
    }

    // Interpolate density and range
    const density = this.interpolate(
      area,
      lower.area,
      upper.area,
      lower.density,
      upper.density
    );
    const range = this.interpolate(
      area,
      lower.area,
      upper.area,
      lower.range,
      upper.range
    );

    // Calculate number of stars based on interpolated density
    const numberOfStars = Math.round(area / density) * (this.starDensity / 100);
    const rangeOfStars = Math.round((range * this.connectionRange) / 100);

    return { num: numberOfStars, range: rangeOfStars };
  }

  instantiateStars(): void {
    if (!this.canvas) return;
    if (!this.canvas.nativeElement.parentElement) return;
    if (!this.context) return;

    const parentWidth = this.canvas.nativeElement.parentElement.offsetWidth;
    const parentHeight = this.canvas.nativeElement.parentElement.offsetHeight;

    const { num, range } = this.adjustStarSettings(parentWidth, parentHeight);

    this.adjustedStarCount = (num * this.starDensity) / 100;
    this.adjustedStarRange = (range * this.connectionRange) / 100;

    console.log('adjustedStarCount', this.adjustedStarCount);
    console.log('adjustedStarRange', this.adjustedStarRange);

    const { maxVelocityX, maxVelocityY } = this.calculateMaxVelocity();

    // This could use array.push for slight performance improvement
    for (let i = 0; i < this.adjustedStarCount; i++) {
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

  clearCanvas(): void {
    if (!this.context) return;

    this.context.clearRect(
      0,
      0,
      this.context.canvas.width,
      this.context.canvas.height
    );

    this.context.globalCompositeOperation = 'lighten';
    this.context.globalAlpha = this.transparency;
  }

  updateStar(star: Star, deltaTime: number): void {
    if (!this.context) return;

    // Update the position
    star.x += star.vx * deltaTime;
    star.y += star.vy * deltaTime;

    // Bounce off the walls
    if (star.x < 0 || star.x > this.context.canvas.width) {
      star.vx = -star.vx;
    }
    if (star.y < 0 || star.y > this.context.canvas.height) {
      star.vy = -star.vy;
    }
  }

  calculateDistance(star1: Star, star2: Star): number {
    const dx = star1.x - star2.x;
    const dy = star1.y - star2.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  drawStar(index: number): void {
    if (!this.context) return;

    const star1 = this.stars[index];

    // Paint the star dot
    this.context.beginPath();
    this.context.arc(star1.x, star1.y, star1.radius, 0, Math.PI * 2);
    this.context.fillStyle = this.starColour;
    this.context.fill();
    this.context.closePath();

    // Connect the stars
    for (let j = index + 1; j < this.stars.length; j++) {
      const star2 = this.stars[j];
      const distance = this.calculateDistance(star1, star2);

      if (distance < this.adjustedStarRange) {
        this.context.beginPath();
        this.context.moveTo(star1.x, star1.y);
        const width =
          this.connectionBaseWidth +
          (1 - distance / this.adjustedStarRange) * 1;
        const opacity = 1 - distance / this.adjustedStarRange;
        this.context.lineWidth = width;
        this.context.lineTo(star1.x, star1.y);
        this.context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        // this.context.strokeStyle = '#FFF';
        this.context.lineTo(star2.x, star2.y);
        this.context.stroke();
      }
    }
  }

  animate(time: number): void {
    if (!this.context) return;
    if (!this.canvas) return;
    if (!this.canvas.nativeElement.parentElement) return;

    // Calculate the time delta
    const deltaTime = time - this.lastTime;
    // console.log('deltaTime', deltaTime);
    this.lastTime = time;

    this.resizeCanvas();
    this.clearCanvas();

    for (let i = 0; i < this.stars.length; i++) {
      // Update the star: O(N)
      this.updateStar(this.stars[i], deltaTime);

      // Draw the star: O(N^2)
      this.drawStar(i);
    }

    requestAnimationFrame((newTime) => this.animate(newTime));
  }
}
