import {
  Component,
  ElementRef,
  ViewChild,
  Directive,
  Input,
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
  connections: { index: number; distance: number }[];
};

type connection = number | undefined;

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
  @Input() ConnectionFPS: number = 15;
  @Input() connectionRange: number = 45;
  @Input() connectionBaseWidth: number = 0.05;
  // Connect to the canvas child component in this angular component
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private context!: CanvasRenderingContext2D;
  private lastWidth: number = 0;
  private lastHeight: number = 0;

  private stars: Star[] = [];
  private connections: Map<number, number[]> = new Map();

  private lastUpdateTime: number = 0;
  private updateConnectionsInterval: number = 0;

  ngAfterViewInit() {
    if (!this.canvas) return;
    if (!this.canvas.nativeElement.parentElement) return; // Going to require a container

    this.context = this.canvas.nativeElement.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    this.updateConnectionsInterval = 1000 / this.ConnectionFPS;

    // Setup the canvas
    this.resizeCanvas();
    this.setupStars();

    this.mainLoop();
  }

  resizeCanvas(): void {
    if (!this.canvas.nativeElement.parentElement) return;
    const parentWidth = this.canvas.nativeElement.parentElement.offsetWidth;
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

    const baseVelocity = 0.001;

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
        radius: Math.random() * 1 + 1,
        vx: Math.random() * 2 * maxVelocityX - maxVelocityX, // TODO: Base it off size of canvas
        vy: Math.random() * 2 * maxVelocityY - maxVelocityY, // TODO: Base it off size of canvas
        connections: [],
      };

      this.stars.push(star);
    }
  }

  mainLoop(time: number = 0) {
    const deltaTime = time - this.lastUpdateTime;
    this.clearCanvas();

    if (this.lastUpdateTime === 0) {
      this.updateConnections();
    }

    if (deltaTime >= this.updateConnectionsInterval) {
      this.lastUpdateTime = time - (deltaTime % this.updateConnectionsInterval);
      this.updateConnections();
    }

    this.paintConnections();

    // Loop through stars, paint and update
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];

      this.updateStar(star);
      this.paintStar(star);
    }

    requestAnimationFrame((newTime) => this.mainLoop(newTime));
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

    this.context.globalCompositeOperation = 'lighter';
    this.context.globalAlpha = 0.2;
  }

  calculateDistance(star1: Star, star2: Star) {
    const dx = star1.x - star2.x;
    const dy = star1.y - star2.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  addRelationship(fromIndex: number, toIndex: number): void {
    if (!this.connections.has(fromIndex)) {
      this.connections.set(fromIndex, []);
    }
    let connections = this.connections.get(fromIndex)!;
    if (!connections.includes(toIndex)) {
      connections.push(toIndex);
    }
  }

  removeRelationship(fromIndex: number, toIndex: number): void {
    if (this.connections.has(fromIndex)) {
      let connections = this.connections.get(fromIndex)!;
      const index = connections.indexOf(toIndex);
      if (index !== -1) {
        connections.splice(index, 1);
      }
    }
  }

  updateConnections(): void {
    for (let i = 0; i < this.stars.length; i++) {
      for (let j = i + 1; j < this.stars.length; j++) {
        const star1 = this.stars[i];
        const star2 = this.stars[j];

        const distance = this.calculateDistance(star1, star2);

        if (distance < this.connectionRange) {
          this.addRelationship(i, j);
        } else {
          // Check if there is a relationship and remove it
          this.removeRelationship(i, j);
        }
      }
    }
  }

  drawLine(star1: Star, star2: Star, width: number, opacity?: number): void {
    // this.context.strokeStyle = '#FFF';
    this.context.lineWidth = width;
    this.context.beginPath();
    this.context.moveTo(star1.x, star1.y);
    this.context.lineTo(star2.x, star2.y);
    this.context.strokeStyle = `rgba(255, 255, 255, ${opacity}`;
    this.context.stroke();
  }

  paintConnections(): void {
    for (const [sourceIndex, targetIndices] of this.connections.entries()) {
      const fromStar = this.stars[sourceIndex];
      for (const targetIndex of targetIndices) {
        const toStar = this.stars[targetIndex];

        const distance = this.calculateDistance(fromStar, toStar);
        const opacity = Math.max(
          1 - Math.pow(distance / this.connectionRange, 2),
          0
        );

        this.drawLine(fromStar, toStar, 1, opacity); // Assuming a line width of 1
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
    star.x += star.vx / this.FPS;
    star.y += star.vy / this.FPS;

    if (star.x < 0 || star.x > this.context.canvas.width) {
      star.vx = -star.vx;
    }

    if (star.y < 0 || star.y > this.context.canvas.height) {
      star.vy = -star.vy;
    }
  }
}
