import { ArtPiece } from "./ArtPiece";
import { ArtCanvas } from "./App";

interface Face {
  face: Point3D[],
  center: Point3D,
}

class Point3D {
  [key: string]: any; // allow dynamic props
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(other: Point3D) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
  }

  subtract(other: Point3D) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
  }

  private rotate(axis1: string, axis2: string, radians: number) {
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const tmp = this[axis1] * cos - this[axis2] * sin;
    this[axis2] = this[axis1] * sin + this[axis2] * cos;
    this[axis1] = tmp;
  }

  rotate_xz(radians: number) {
    this.rotate("x", "z", radians);
  }

  rotate_xy(radians: number) {
    this.rotate("x", "y", radians);
  }

  rotate_yz(radians: number) {
    this.rotate("y", "z", radians);
  }
}

class IsoUtils {
  private canvas: ArtCanvas;

  constructor(canvas: ArtCanvas) {
    this.canvas = canvas;
  }

  private convertToIso(c: Point3D) {
    const sqrt2 = Math.sqrt(2);
    const sqrt3 = Math.sqrt(3);
    const temp_x = sqrt3 * c.x + 0 * c.y + -sqrt3 * c.z;
    const temp_y = 1 * c.x + 2 * c.y + 1 * c.z;
    const temp_z = sqrt2 * c.x + -sqrt2 * c.y + sqrt2 * c.z;
    c.x = temp_x;
    c.y = temp_y;
    c.z = temp_z;
  }

  generateCube(
    bottom_left_front: Point3D,
    randomize: boolean,
    rotate_radians?: number,
  ): Point3D[] {
    let cube: Point3D[] = [
      // top face (ends up bottom in isometric projection)
      new Point3D(0, 1, 0), // top left front
      new Point3D(1, 1, 0), // top right front
      new Point3D(1, 1, 1), // top right back
      new Point3D(0, 1, 1), // top left back
      new Point3D(0, 1, 0), // top left front

      // front face (ends up back right in isometric projection)
      new Point3D(0, 0, 0), // bottom left front
      new Point3D(1, 0, 0), // bottom right front
      new Point3D(1, 1, 0), // top right front
      new Point3D(0, 1, 0), // top left front
      new Point3D(0, 0, 0), // bottom left front

      // left face (ends up back left in isometric projection)
      new Point3D(0, 0, 0), // bottom left front
      new Point3D(0, 0, 1), // bottom left back
      new Point3D(0, 1, 1), // top left back
      new Point3D(0, 1, 0), // top left front
      new Point3D(0, 0, 0), // bottom left front

      // back face (ends up front left in isometric projection)
      new Point3D(0, 0, 1), // bottom left back
      new Point3D(1, 0, 1), // bottom right back
      new Point3D(1, 1, 1), // top right back
      new Point3D(0, 1, 1), // top left back
      new Point3D(0, 0, 1), // bottom left back

      // right face (ends up front right in isometric projection)
      new Point3D(1, 0, 0), // bottom right front
      new Point3D(1, 0, 1), // bottom right back
      new Point3D(1, 1, 1), // top right back
      new Point3D(1, 1, 0), // top right front
      new Point3D(1, 0, 0), // bottom right front

      // bottom face (ends up top in isometric projection)
      new Point3D(0, 0, 0), // bottom left front
      new Point3D(1, 0, 0), // bottom right front
      new Point3D(1, 0, 1), // bottom right back
      new Point3D(0, 0, 1), // bottom left back
      new Point3D(0, 0, 0) // bottom left front
    ];
    bottom_left_front.y *= -1;

    let random_index = Math.floor(Math.random() * 99999);
    const scale = 20;
    const parameter = this.canvas.state.parameterA - 5;
    cube.forEach(p => {
      const center_translation = new Point3D(0.5, 0.5, 0.5);

      if (rotate_radians) {
        p.subtract(center_translation);
        p.rotate_xz(rotate_radians);
        p.add(center_translation);
      }

      p.add(bottom_left_front);

      if (randomize) {
        const random = new Point3D(
          (this.canvas.state.random_pool[random_index++] * parameter) / scale,
          (this.canvas.state.random_pool[random_index++] * parameter) / scale,
          0
        );

        if (this.canvas.state.random_pool[random_index++] > 0.5) {
          p.add(random);
        } else {
          p.subtract(random);
        }
      }
    });

    return cube;
  }

  drawArtIso(color: boolean) {
    let random_index = 0;
    const cube_size = 10;
    const horizontal_cubes = cube_size;
    const cube_depth = cube_size;
    const cube_height = cube_size;

    const starting_height = cube_height;
    let column_height: number[][] = [];
    for (let row = 0; row < cube_depth; row++) {
      column_height[row] = [];
      for (let col = 0; col < horizontal_cubes; col++) {
        let prev_height = starting_height;
        if (row - 1 >= 0) {
          prev_height = column_height[row - 1][col];
        }

        column_height[row][col] = prev_height;
        if (this.canvas.state.random_pool[random_index++] < col / horizontal_cubes) {
          column_height[row][col]--;
        }

        if (col - 1 >= 0) {
          column_height[row][col] = Math.min(
            column_height[row][col],
            column_height[row][col - 1]
          );
        }
      }
    }

    // 0 depth is at the back
    // 0 i is to the right

    let cubes: Point3D[] = [];
    for (let height = 0; height < cube_height; height++) {
      for (let depth = 0; depth < cube_depth; depth++) {
        for (let i = 0; i < horizontal_cubes; i++) {
          // skip if there is something
          // - in front of it and,
          // - to the right of it and,
          // - on top of it
          const in_front =
            depth + 1 < column_height.length &&
            column_height[depth + 1][i] > height + 1;
          const to_the_right =
            i + 1 < column_height[depth].length &&
            column_height[depth][i + 1] > height + 1;
          const occluded = in_front && to_the_right;
          if (!occluded && height <= column_height[depth][i]) {
            cubes.push(
              ...this.generateCube(new Point3D(i, height, depth), !color)
            );
          }
        }
      }
    }

    this.paintIsoArt(horizontal_cubes, cube_depth, cubes, color);
  }

  private convertToScreenCoordinates(
    cube_depth: number,
    scale: number,
    x: number
  ): number {
    const sqrt3 = Math.sqrt(3);
    return (x + sqrt3 * cube_depth) * scale;
  }

  private renderIsoPath(face: Face, fill_color: string) {
    const ctx = this.canvas.getContext();
    const debug_stroke_color = ["red", "green", "blue", "black"];
    const debug = false;

    ctx.fillStyle = fill_color;
    ctx.beginPath();
    ctx.moveTo(face.face[0].x, face.face[0].y);
    for (let i = 1; i < face.face.length; i++) {
      ctx.lineTo(face.face[i].x, face.face[i].y);
    }
    ctx.closePath();
    ctx.fill();

    if (!debug) {
      ctx.stroke();
    } else {
      for (let i = 1; i < face.face.length; i++) {
        ctx.beginPath();
        ctx.moveTo(face.face[i - 1].x, face.face[i - 1].y);
        ctx.lineTo(face.face[i].x, face.face[i].y);
        ctx.setLineDash([2, 10 + Math.floor(Math.random() * 20)]);
        ctx.strokeStyle = debug_stroke_color[(i - 1) % 4];
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  paintIsoArt(
    horizontal_cubes: number,
    cube_depth: number,
    cube_vertices: Point3D[],
    color: boolean,
  ) {
    const ctx = this.canvas.getContext();
    // console.log("rendering", cubes.length / (5 * 6), "cubes");

    // range is:
    // [-sqrt3 * cube_depth, ..., horizontal_cubes * sqrt3]
    // add cube_depth * sqrt3 (done in convertToScreenCoordinates)
    //   [0, ..., horizontal_cubes * sqrt3 + cube_depth * sqrt3]
    // = [0, ..., (horizontal_cubes + cube_depth) * sqrt3]
    // divide by (horizontal_cubes + cube_depth) * sqrt3
    // [0, ..., 1]
    // multiply by draw_width
    // [0, ..., draw_width]
    const scale =
      this.canvas.draw_width / ((horizontal_cubes + cube_depth) * Math.sqrt(3));

    let faces: Face[] = [];
    let face_vertices: Point3D[] = [];
    let face_sum: Point3D = new Point3D();
    for (let i = 0; i < cube_vertices.length; i++) {
      this.convertToIso(cube_vertices[i]);
      face_vertices.push(cube_vertices[i]);

      if (face_vertices.length === 5) {
        faces.push({
          face: face_vertices,
          center: new Point3D(face_sum.x / 4, face_sum.y / 4, face_sum.z / 4)
        });
        face_vertices = [];
        face_sum = new Point3D();
      } else {
        face_sum.add(cube_vertices[i]);
      }

      cube_vertices[i].x = this.convertToScreenCoordinates(
        cube_depth,
        scale,
        cube_vertices[i].x
      );
      cube_vertices[i].y = this.convertToScreenCoordinates(
        cube_depth,
        scale,
        cube_vertices[i].y
      );
      cube_vertices[i].z = this.convertToScreenCoordinates(
        cube_depth,
        scale,
        cube_vertices[i].z
      );
    }

    faces.sort((a, b) => a.center.z - b.center.z);

    ctx.beginPath();

    let palette = ["white"];
    if (color) {
      // generated with https://colourco.de/
      const palettes = [
        ["#619b3d", "#3e9eaa", "#8a3eba", "#c55243"],
        ["#c6a36c", "#75cd7f", "#7e9fd4", "#da88d1"],
        ["#42b87a", "#42bda1", "#44b7c0", "#4794c2", "#4972c5"],
        ["#35885c", "#373997", "#a63772", "#b6b238"],
        ["#cd7376", "#d08e76", "#d2ab79", "#d4c87c", "#c8d67f"],
        ["#3e9e55", "#3f5cad", "#bd3f9f", "#c6a445"]
      ];
      palette =
        palettes[Math.floor((this.canvas.state.parameterA / 11) * palettes.length)];
    }

    let palette_index = 0;
    faces.forEach(f => {
      this.renderIsoPath(f, palette[palette_index]);
      palette_index = (palette_index + 1) % palette.length;
    });
  }
}

export class IsoCube extends ArtPiece {
  draw() {
    const utils = new IsoUtils(this.canvas);
    utils.drawArtIso(!"no color");
  }
}

export class IsoCubeColor extends ArtPiece {
  draw() {
    const utils = new IsoUtils(this.canvas);
    utils.drawArtIso(!!"color");
  }
}

export class IsoCubeRotate extends ArtPiece {
  private rotating_cube_radians: number;

  constructor(name: string, canvas: ArtCanvas) {
    super(name, canvas);
    this.rotating_cube_radians = 0;
  }

  private renderAnimationFrame(render_fn: () => void) {
    const ctx = this.canvas.getContext();

    this.canvas.clear();
    ctx.save();
    this.canvas.center();
    render_fn();
    ctx.restore();
  }

  private drawArtRotatingCubeFrame() {
    const utils = new IsoUtils(this.canvas);
    const cube_coords = utils.generateCube(new Point3D(0, 0.8, 0), false, this.rotating_cube_radians);
    this.renderAnimationFrame(() => utils.paintIsoArt(1, 1, cube_coords, false));

    // todo make rotation speed framerate independant
    this.rotating_cube_radians += 0.01 * (this.canvas.state.parameterA - 4);
    this.canvas.animation_id = requestAnimationFrame(this.drawArtRotatingCubeFrame.bind(this));
  }

  private drawArtRotatingCube() {
    this.canvas.animation_id = requestAnimationFrame(this.drawArtRotatingCubeFrame.bind(this));
  }

  draw() {
    this.drawArtRotatingCube();
  }
}