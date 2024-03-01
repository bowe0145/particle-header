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
  @Input() starCount = 100;
  @Input() FPS: number = 60;
  @Input() connectionRange: number = 100;
  @Input() connectionBaseWidth: number = 0.5;
  @Input() starSpeed: number = 0.00005;
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

    // We want to setup the size here because in the future we will
    // Want to derive the count from the width/height + preferred density
    this.stars = Array(this.starCount);
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

  instantiateStars(): void {
    if (!this.canvas) return;
    if (!this.canvas.nativeElement.parentElement) return;
    if (!this.context) return;

    const { maxVelocityX, maxVelocityY } = this.calculateMaxVelocity();

    // This could use array.push for slight performance improvement
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

      if (distance < this.connectionRange) {
        this.context.beginPath();
        this.context.moveTo(star1.x, star1.y);
        const width =
          this.connectionBaseWidth + (1 - distance / this.connectionRange) * 1;
        const opacity = 1 - distance / this.connectionRange;
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
