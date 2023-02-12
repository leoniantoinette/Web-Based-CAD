class Tool {
  // constructor
  constructor(canvas, gl, models, currentColor) {
    this.canvas = canvas;
    this.gl = gl;
    this.models = models;
    this.currentColor = currentColor;
  }

  // set current color
  setColor(color) {
    this.currentColor = color;
  }

  // redraw canvas
  redrawCanvas() {
    // Clear the canvas
    this.gl.clearColor(0, 0, 0, 0.5);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    // draw all models
    for (let model of this.models) {
      model.draw();
    }
  }

  // get mouse position
  getMousePosition(event) {
    let x = (event.offsetX / this.canvas.clientWidth) * 2 - 1;
    let y = (1 - event.offsetY / this.canvas.clientHeight) * 2 - 1;
    return new Point(x, y);
  }

  // search index of selected model's point in models
  searchModelPointIndex(point) {
    for (let i = this.models.length - 1; i > -1; i--) {
      for (let j = 0; j < this.models[i].points.length; j++) {
        if (this.models[i].points[j].isNear(point)) {
          return {
            modelIndex: i,
            pointIndex: j,
          };
        }
      }
    }
    return -1;
  }

  // search index of selected model in models
  searchModelIndex(point) {
    for (let i = this.models.length - 1; i > -1; i--) {
      if (this.models[i].isContain(point)) {
        return i;
      }
    }
    return -1;
  }

  // reset tool
  reset() {}
}

class LineTool extends Tool {
  // constructor
  constructor(canvas, gl, models, currentColor) {
    super(canvas, gl, models, currentColor);
    this.line = null;
    this.isDrawing = false;
  }

  // handle click event
  handleClick(event) {
    if (!this.isDrawing) {
      let mousePosition = this.getMousePosition(event);
      mousePosition.setColor(this.currentColor);
      console.log(this.currentColor);
      this.line = new Line(this.gl, [mousePosition, new Point()]);
      this.isDrawing = true;
    } else {
      this.models.push(this.line);
      console.log(this.line);
      this.reset();
      this.redrawCanvas();
    }
  }

  // handle mousemove event
  handleMouseMove(event) {
    if (this.isDrawing) {
      this.redrawCanvas();
      let mousePosition = this.getMousePosition(event);
      this.line.points[1].setPoint(
        mousePosition.getAbsis(),
        mousePosition.getOrdinate()
      );
      this.line.points[1].setColor(this.currentColor);
      this.line.draw();
    }
  }

  // reset tool
  reset() {
    this.line = null;
    this.isDrawing = false;
  }
}

class RectangleTool extends Tool {
  // constructor
  constructor(canvas, gl, models, currentColor) {
    super(canvas, gl, models, currentColor);
    this.rectangle = null;
    this.isDrawing = false;
  }

  // handle click event
  handleClick(event) {
    if (!this.isDrawing) {
      let mousePosition = this.getMousePosition(event);
      mousePosition.setColor(this.currentColor);
      console.log(this.currentColor);
      this.rectangle = new Rectangle(this.gl, [mousePosition, new Point()]);
      this.isDrawing = true;
    } else {
      this.models.push(this.rectangle);
      console.log(this.rectangle.points);
      this.reset();
      this.redrawCanvas();
    }
  }

  // handle mousemove event
  handleMouseMove(event) {
    if (this.isDrawing) {
      this.redrawCanvas();
      let mousePosition = this.getMousePosition(event);
      let x1 = this.rectangle.points[0].x;
      let y1 = this.rectangle.points[0].y;
      let x2 = mousePosition.getAbsis();
      let y2 = mousePosition.getOrdinate();
      // set changing points while moving mouse
      this.rectangle.points[1].setPoint(x1, y2);
      this.rectangle.points[2].setPoint(x2, y1);
      this.rectangle.points[3].setPoint(x2, y2);
      // set all points of the same color, might change this part
      this.rectangle.points[1].setColor(this.currentColor);
      this.rectangle.points[2].setColor(this.currentColor);
      this.rectangle.points[3].setColor(this.currentColor);
      this.rectangle.draw();
    }
  }

  // reset tool
  reset() {
    this.rectangle = null;
    this.isDrawing = false;
  }
}

class MovePointTool extends Tool {
  // constructor
  constructor(canvas, gl, models, currentColor) {
    super(canvas, gl, models, currentColor);
    this.isMoving = false;
    this.referencePoint = [];
    this.selectedModel = null;
  }

  // handle mouse down event
  handleMouseDown(event) {
    let mousePosition = this.getMousePosition(event);
    let index = this.searchModelPointIndex(mousePosition);
    if (index != -1) {
      this.isMoving = true;
      if (this.models[index.modelIndex] instanceof Line) {
        if (index.pointIndex == 0) {
          var refPointIndex = 1;
          var selectedPointIndex = 0;
        } else {
          var refPointIndex = 0;
          var selectedPointIndex = 1;
        }
        mousePosition.setColor(
          this.models[index.modelIndex].points[selectedPointIndex].getColor()
        );
        let oldRefPoint = this.models[index.modelIndex].points[refPointIndex];
        let referencePoint = new Point();
        referencePoint.setPoint(
          oldRefPoint.getAbsis(),
          oldRefPoint.getOrdinate()
        );
        referencePoint.setColor(oldRefPoint.getColor());
        this.referencePoint.push(referencePoint);
        this.selectedModel = new Line(this.gl, [
          this.referencePoint[0],
          mousePosition,
        ]);
      }
      this.models.splice(index.modelIndex, 1);
      this.redrawCanvas();
      this.selectedModel.draw();
    }
  }

  // handle mouse move event
  handleMouseMove(event) {
    if (this.isMoving) {
      this.redrawCanvas();
      let mousePosition = this.getMousePosition(event);
      this.selectedModel.points[1].setPoint(
        mousePosition.getAbsis(),
        mousePosition.getOrdinate()
      );
      this.selectedModel.draw();
    }
  }

  // handle mouse up event
  handleMouseUp(event) {
    if (this.isMoving) {
      this.models.push(this.selectedModel);
      this.reset();
      this.redrawCanvas();
    }
  }

  // reset tool
  reset() {
    this.isMoving = false;
    this.referencePoint = [];
    this.selectedModel = null;
  }
}

class TranslateTool extends Tool {
  // constructor
  constructor(canvas, gl, models, currentColor) {
    super(canvas, gl, models, currentColor);
    this.selectedModelIndex = -1;
  }

  // handle click event
  handleClick(event) {
    let mousePosition = this.getMousePosition(event);
    let index = this.searchModelIndex(mousePosition);
    if (index != -1) {
      this.selectedModelIndex = index;

      // reset input value
      const translateX = document.getElementById("translateX");
      const translateY = document.getElementById("translateY");
      translateX.value = 0;
      translateY.value = 0;
    }
  }

  // handle input value change
  handleInputValueChange(x, y) {
    if (this.selectedModelIndex != -1) {
      this.models[this.selectedModelIndex].translate(x, y);
      this.redrawCanvas();
    }
  }

  // reset tool
  reset() {
    const transformInput = document.getElementById("transform-input");
    transformInput.innerHTML = "";
    this.selectedModelIndex = -1;
  }
}
