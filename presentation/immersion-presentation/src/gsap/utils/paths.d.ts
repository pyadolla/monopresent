export function getRawPath(value: any): any;
export function copyRawPath(rawPath: any): any;
export function reverseSegment(segment: any): void;
export function convertToPath(element: any, swap: any): any;
export function getRotationAtProgress(rawPath: any, progress: any): number;
export function sliceRawPath(rawPath: any, start: any, end: any): any;
export function cacheRawPathMeasurements(rawPath: any, resolution: any): any;
export function subdivideSegment(segment: any, i: any, t: any): 0 | 6;
export function getPositionOnPath(rawPath: any, progress: any, includeAngle: any, point: any): {
    x: number;
    y: number;
    angle: any;
};
export function transformRawPath(rawPath: any, a: any, b: any, c: any, d: any, tx: any, ty: any): any;
export function stringToRawPath(d: any): any[];
export function bezierToPoints(x1: any, y1: any, x2: any, y2: any, x3: any, y3: any, x4: any, y4: any, threshold: any, points: any, index: any): any;
export function flatPointsToSegment(points: any, curviness: any): any[];
export function pointsToSegment(points: any, curviness: any, cornerThreshold: any): number[];
export function simplifyPoints(points: any, tolerance: any): number[];
export function getClosestData(rawPath: any, x: any, y: any, slices: any): {
    j: number;
    i: number;
    t: number;
};
export function subdivideSegmentNear(x: any, y: any, segment: any, slices: any, iterations: any): number;
export function rawPathToString(rawPath: any): string;
