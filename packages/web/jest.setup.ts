import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { TransformStream, ReadableStream, WritableStream } from 'stream/web';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.TransformStream = TransformStream as any;
global.ReadableStream = ReadableStream as any;
global.WritableStream = WritableStream as any;
