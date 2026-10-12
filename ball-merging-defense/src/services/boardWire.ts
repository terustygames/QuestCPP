// Упаковка снимка поля для Realtime Database.
// JSON сжимается встроенным deflate (CompressionStream) и кладётся в базу строкой 'z:' + base64.
// Если сжатие недоступно или не даёт выигрыша, уходит обычный JSON (как раньше).
// Чтение: строка с префиксом 'z:' распаковывается, всё остальное читается как JSON.

const PREFIX = 'z:';

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64ToBytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function runStream(data: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const piped = new Blob([data]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(piped).arrayBuffer());
}

// JSON -> строка для базы
export async function packBoard(json: string): Promise<string> {
  let stream: CompressionStream;
  try {
    stream = new CompressionStream('deflate-raw');
  } catch {
    return json; // браузер не умеет сжимать — шлём как есть
  }
  const z = await runStream(new TextEncoder().encode(json), stream);
  const packed = PREFIX + bytesToBase64(z);
  return packed.length < json.length ? packed : json;
}

// Строка из базы -> JSON
export async function unpackBoard(raw: string): Promise<string> {
  if (!raw.startsWith(PREFIX)) return raw;
  const out = await runStream(base64ToBytes(raw.slice(PREFIX.length)), new DecompressionStream('deflate-raw'));
  return new TextDecoder().decode(out);
}
