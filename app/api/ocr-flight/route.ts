import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { parseFlightDataFromOcr } from '@/services/ocrFlightService';

// Disable standard body parser limits for high-res images
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 1. Image preprocessing with Sharp:
    // Resize high-res, apply contrast normalization and sharpening to make text 100% legible
    const meta = await sharp(inputBuffer).metadata();
    const originalWidth = meta.width || 465;
    const targetWidth = Math.max(originalWidth * 3, 1600);

    const processedBuffer = await sharp(inputBuffer)
      .resize(targetWidth, null, { kernel: 'lanczos3' })
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    // Explicit absolute workerPath to prevent Turbopack bundle virtual path resolution errors ('/ROOT/...')
    const workerPath = path.resolve(process.cwd(), 'node_modules/tesseract.js/src/worker-script/node/index.js');

    // 2. Run Tesseract Worker
    const worker = await createWorker('eng', 1, {
      workerPath,
    });
    const ocrResult = await worker.recognize(processedBuffer);
    const ocrText = ocrResult.data.text || '';
    await worker.terminate();

    // 3. Also do a targeted threshold scan on the top header for Cities/Dates
    let headerText = '';
    try {
      const topHeight = Math.round((meta.height || 1024) * 0.35);
      const headerBuffer = await sharp(inputBuffer)
        .extract({ left: 0, top: 0, width: meta.width || 465, height: topHeight })
        .resize(targetWidth, null)
        .greyscale()
        .threshold(165)
        .toBuffer();

      const headerWorker = await createWorker('eng', 1, {
        workerPath,
      });
      const headerResult = await headerWorker.recognize(headerBuffer);
      headerText = headerResult.data.text || '';
      await headerWorker.terminate();
    } catch (e) {
      console.warn('Header specific threshold error:', e);
    }

    const combinedText = `${headerText}\n\n${ocrText}`;
    const parsed = parseFlightDataFromOcr(combinedText);

    return NextResponse.json({
      success: true,
      trip: parsed.trip,
      flights: parsed.flights,
      rawText: combinedText,
    });
  } catch (error: any) {
    console.error('Server OCR error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process image OCR' },
      { status: 500 }
    );
  }
}

