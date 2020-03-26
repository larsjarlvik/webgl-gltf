interface Position {
    x: number;
    y: number;
}

const getPinchDistance = (event: TouchEvent) => {
    const xyDistance = {
        x: Math.abs(event.touches[0].clientX - event.touches[1].clientX),
        y: Math.abs(event.touches[0].clientY - event.touches[1].clientY),
    };

    return Math.sqrt(xyDistance.x * xyDistance.x + xyDistance.y * xyDistance.y);
}

const listen = (canvas: HTMLCanvasElement, drag: (rotation: Position) => void, zoom: (zoom: number) => void) => {
    let lastPosition: Position | undefined;
    let zoomStart: number | undefined;

    const dragEvent = (event) => {
        const client = event.touches
            ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
            : { x: event.clientX, y: event.clientY };

        if (lastPosition !== undefined) {
            drag({
                x: (client.x - lastPosition.x) / 100.0,
                y: (client.y - lastPosition.y) / 100.0
            });
        }

        lastPosition = {
            x: client.x,
            y: client.y,
        };
    };


    canvas.addEventListener('wheel', (event) => {
        zoom(event.deltaY > 0 ? 0.05: -0.05);
    });

    canvas.addEventListener('mousedown', () => {
        canvas.addEventListener('mousemove', dragEvent);
    });

    canvas.addEventListener('mouseup', () => {
        canvas.removeEventListener('mousemove', dragEvent);
        lastPosition = undefined;
    });


    canvas.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1 && zoomStart === undefined) {
            dragEvent(event);
            return;
        }

        if (event.touches.length === 2 && zoomStart !== undefined) {
            const distance = getPinchDistance(event);
            zoom((zoomStart - distance) / 4000.0)
        }

        event.preventDefault();
        event.stopPropagation();
    });

    canvas.addEventListener('touchstart', (event) => {
        zoomStart = getPinchDistance(event);
    });

    canvas.addEventListener('touchend', (event) => {
        if (event.touches.length === 0) {
            zoomStart = undefined;
            lastPosition = undefined;
        }
    });
};

export {
    listen,
    Position,
};
