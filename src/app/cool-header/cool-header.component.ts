import {
  Component,
  ElementRef,
  ViewChild,
  Directive,
  Input,
  HostListener,
} from '@angular/core';

@Directive({ selector: 'pane', standalone: true })
export class Pane {
  @Input() id!: string;
}

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
  @Input() FPS: number = 60;
  @Input() connectionRange: number = 45;
  @Input() connectionBaseWidth: number = 0.005;
  @Input() starSpeed: number = 0.05;

  // Connect to the canvas child component in this angular component
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.resizeCanvas(event.target.innerWidth);
  }

  private context!: CanvasRenderingContext2D;
  private lastWidth: number = 0;
  private lastHeight: number = 0;

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

    this.mainLoop();
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

  mainLoop() {
    this.clearCanvas();

    for (let i = 0; i < this.stars.length; i++) {
      this.update(i);
      this.paint(i);
    }

    requestAnimationFrame(() => this.mainLoop());
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

  drawLine(star1: Star, star2: Star, width: number, opacity?: number): void {
    this.context.lineWidth = width;
    this.context.beginPath();
    this.context.moveTo(star1.x, star1.y);
    this.context.lineTo(star2.x, star2.y);
    // Set the colour to be white with an opacity that fades out as the distance increases
    this.context.strokeStyle = `rgba(255, 255, 255, ${opacity}`;
    this.context.stroke();
  }

  update(index: number): void {
    this.updateStar(this.stars[index]);
  }

  paint(index: number): void {
    // Paint the dot
    this.paintStar(this.stars[index]);

    // Loop through the other stars (only the ones that haven't been connected yet)
    // To prevent double connections
    const star1 = this.stars[index];
    for (let i = index + 1; i < this.stars.length; i++) {
      const star2 = this.stars[i];

      if (this.calculateDistance(star1, star2) < this.connectionRange) {
        const distance = this.calculateDistance(star1, star2);
        const width = this.getConnectionWidth(distance);
        // Paint the connecting line
        this.drawLine(star1, star2, width, 1);
      }
    }
  }

  paintStar(star: Star): void {
    this.context.fillStyle = '#ccc';
    this.context.beginPath();
    this.context.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
    this.context.fill();
  }

  updateStar(star: Star): void {
    // Move the star
    star.x += star.vx / this.FPS;
    star.y += star.vy / this.FPS;

    // Check if it should bounce
    if (star.x < 0 || star.x > this.context.canvas.width) {
      star.vx = -star.vx;
    }

    if (star.y < 0 || star.y > this.context.canvas.height) {
      star.vy = -star.vy;
    }
  }
}
