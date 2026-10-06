/**
 * @file YuvFrameWriter.kt
 * @description Reuses scanline buffers for RGB to YUV420 conversion, respecting planar/interleaved strides.
 */
package expo.modules.yeoloreel

import java.nio.ByteBuffer

internal data class YuvPlane(val buffer: ByteBuffer, val rowStride: Int, val pixelStride: Int)

/** Keeps one row per plane; only contiguous samples are copied in bulk to avoid overwriting shared chroma. */
internal class YuvFrameWriter(private val width: Int, private val height: Int) {
  private val yRow = ByteArray(width)
  private val uRow = ByteArray(width / 2)
  private val vRow = ByteArray(width / 2)

  init { require(width > 0 && height > 0 && width % 2 == 0 && height % 2 == 0) }

  fun write(pixels: IntArray, yPlane: YuvPlane, uPlane: YuvPlane, vPlane: YuvPlane) {
    require(pixels.size >= width * height)
    for (y in 0 until height) {
      val offset = y * width
      for (x in 0 until width) {
        val rgb = pixels[offset + x]
        val r = (rgb shr 16) and 255; val g = (rgb shr 8) and 255; val b = rgb and 255
        yRow[x] = ((((66*r + 129*g + 25*b + 128) shr 8) + 16).coerceIn(0, 255)).toByte()
        if ((y and 1) == 0 && (x and 1) == 0) {
          val chroma = x / 2
          uRow[chroma] = ((((-38*r - 74*g + 112*b + 128) shr 8) + 128).coerceIn(0, 255)).toByte()
          vRow[chroma] = ((((112*r - 94*g - 18*b + 128) shr 8) + 128).coerceIn(0, 255)).toByte()
        }
      }
      copyRow(yRow, yPlane, y)
      if ((y and 1) == 0) {
        copyRow(uRow, uPlane, y / 2)
        copyRow(vRow, vPlane, y / 2)
      }
    }
  }

  private fun copyRow(samples: ByteArray, plane: YuvPlane, row: Int) {
    val offset = row * plane.rowStride
    if (plane.pixelStride == 1) {
      plane.buffer.position(offset)
      plane.buffer.put(samples)
    } else {
      for (index in samples.indices) plane.buffer.put(offset + index * plane.pixelStride, samples[index])
    }
  }
}
