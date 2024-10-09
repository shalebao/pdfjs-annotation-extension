import { nanoid } from 'nanoid'
/**
 * 根据颜色字符串获取 RGB 数组。
 * 支持以下格式：'#RRGGBB'、'rgb(R, G, B)'、'rgba(R, G, B, A)'。
 * @param color - 要解析的颜色字符串
 * @returns 表示颜色的 RGB 数组，如 [R, G, B]。
 * 如果颜色格式无效，则返回 [0, 0, 0]。
 */
function getRGB(color: string): number[] {
    if (color.startsWith('#')) {
        const colorRGB = parseInt(color.slice(1), 16)
        return [(colorRGB & 0xff0000) >> 16, (colorRGB & 0x00ff00) >> 8, colorRGB & 0x0000ff]
    }

    if (color.startsWith('rgb(')) {
        return color
            .slice(4, -1) // 去掉 "rgb(" 和 ")"
            .split(',')
            .map(x => parseInt(x.trim()))
    }

    if (color.startsWith('rgba(')) {
        return color
            .slice(5, -1) // 去掉 "rgba(" 和 ")"
            .split(',')
            .map((x, index) => (index < 3 ? parseInt(x.trim()) : 1)) // 只保留 RGB 部分，忽略透明度
    }

    console.error(`Not a valid color format: "${color}"`)
    return [0, 0, 0]
}

/**
 * 检查元素是否存在于 DOM 中。
 * @param element - 要检查的元素
 * @returns 如果元素存在于 DOM 中，则返回 true；否则返回 false。
 */
function isElementInDOM(element: HTMLElement): boolean {
    return document.body.contains(element)
}

/**
 * 生成uuid
 * @returns nanoid
 */
function generateUUID(): string {
    return nanoid()
}

/**
 * 获取指定长度的随机字节数组。
 * 使用 window.crypto 或 node.js 的 crypto 获取安全的随机值。
 * @param length - 随机字节的长度
 * @returns 随机字节数组
 */
function getRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length)
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        crypto.getRandomValues(bytes)
    } else {
        for (let i = 0; i < length; i++) {
            bytes[i] = Math.floor(Math.random() * 256)
        }
    }
    return bytes
}

/**
 * 设置文档元素的 CSS 自定义属性。
 * @param propertyName - 属性名称
 * @param value - 属性值
 */
function setCssCustomProperty(propertyName: string, value: string): void {
    document.documentElement.style.setProperty(propertyName, value)
}

/**
 * 移除文档元素的 CSS 自定义属性。
 * @param propertyName - 要移除的属性名称
 */
function removeCssCustomProperty(propertyName: string): void {
    document.documentElement.style.removeProperty(propertyName)
}

/**
 * 将 Base64 格式的图像数据转换为 ImageBitmap 对象。
 * @param base64 - Base64 编码的图像数据
 * @returns ImageBitmap 对象，表示转换后的图像
 */
async function base64ToImageBitmap(base64: string): Promise<ImageBitmap> {
    // 将 Base64 数据去掉前缀部分 "data:image/png;base64," (如果有)
    const base64Data = base64.split(',')[1]

    // 解码 Base64 数据为二进制字符串
    const binaryString = atob(base64Data)

    // 创建一个 Uint8Array 来存储解码后的二进制数据
    const length = binaryString.length
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }

    // 创建 Blob 对象，类型为 image/png
    const blob = new Blob([bytes], { type: 'image/png' })

    // 将 Blob 转换为 ImageBitmap
    const imageBitmap = await createImageBitmap(blob)

    return imageBitmap
}

/**
 * 格式化文件大小，将字节数转换为友好的字符串格式。
 * @param sizeInBytes - 文件大小，单位字节
 * @returns 友好格式的文件大小字符串，如 "2.56 MB"
 */
function formatFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`
    const units = ['KB', 'MB', 'GB', 'TB']
    let unitIndex = -1
    let size = sizeInBytes
    do {
        size /= 1024
        unitIndex++
    } while (size >= 1024 && unitIndex < units.length - 1)

    return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 等比缩放图像的宽度和高度，使其在给定的最大宽度或高度内。
 * @param width - 原始图像的宽度
 * @param height - 原始图像的高度
 * @param max - 最大宽度或高度，缩放后的尺寸任意一边都不超过该值
 * @returns 包含等比缩放后的宽度和高度的对象 { newWidth, newHeight }
 */
function resizeImage(width: number, height: number, max: number): { newWidth: number; newHeight: number } {
    // 检查是否需要缩放
    if (width <= max && height <= max) {
        // 如果宽度和高度都在 max 范围内，不需要缩放，直接返回原尺寸
        return { newWidth: width, newHeight: height }
    }

    // 计算宽度和高度的缩放比例
    const widthScale = max / width
    const heightScale = max / height

    // 选择较小的比例来保持图像的宽高比
    const scaleFactor = Math.min(widthScale, heightScale)

    // 计算缩放后的宽度和高度
    const newWidth = width * scaleFactor
    const newHeight = height * scaleFactor

    return { newWidth, newHeight }
}

/**
 * 验证并格式化自定义页码
 * @param {string} input - 用户输入的页码字符串，如 "1,1-2,2-3"
 * @returns {Array<number> | null} - 格式化后的页码数组，或在输入无效时返回 null
 */
function parsePageRanges(input: string): number[] | null {
    const pages = new Set<number>()
    const rangeRegex = /^(\d+)(?:-(\d+))?$/

    // 分割输入字符串
    const parts = input.split(',')

    for (const part of parts) {
        const match = part.match(rangeRegex)

        if (match) {
            const start = parseInt(match[1], 10)
            const end = match[2] ? parseInt(match[2], 10) : start

            // 如果范围无效（例如2-1），则返回 null
            if (start > end) {
                return null
            }

            for (let i = start; i <= end; i++) {
                if (i !== 0) {
                    // 去掉 0
                    pages.add(i)
                }
            }
        } else {
            return null
        }
    }

    // 返回排序后的页码数组
    return Array.from(pages).sort((a, b) => a - b)
}

function convertToRGB(array, index = 0) {
    if (index < 0 || index * 3 + 2 >= array.length) {
        throw new Error("Index out of bounds");
    }
    const r = array[index * 3];
    const g = array[index * 3 + 1];
    const b = array[index * 3 + 2];

    return `rgb(${r}, ${g}, ${b})`;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    // 获取各个部分
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // 偏移时区，例如 +08'00'
    const timezoneOffset = -date.getTimezoneOffset();
    const timezoneHours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const timezoneMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
    const timezoneSign = timezoneOffset >= 0 ? '+' : '-';

    // 拼接最终结果
    return `D:${year}${month}${day}${hours}${minutes}${seconds}${timezoneSign}${timezoneHours}'${timezoneMinutes}'`;
}

function formatPDFDate(dateString) {
    // 提取日期部分 D:YYYYMMDDHHMMSS+TZD 中的 YYYYMMDDHHMMSS
    const datePart = dateString.slice(2, 16);

    // 使用正则表达式解析日期部分
    const year = datePart.slice(0, 4);
    const month = datePart.slice(4, 6);
    const day = datePart.slice(6, 8);
    const hour = datePart.slice(8, 10);
    const minute = datePart.slice(10, 12);

    // 获取当前年份
    const currentYear = new Date().getFullYear().toString();

    // 如果是当前年，则不输出年
    if (year === currentYear) {
        return `${month}/${day} ${hour}:${minute}`;
    } else {
        return `${year}/${month}/${day} ${hour}:${minute}`;
    }
}




export {
    base64ToImageBitmap,
    formatFileSize,
    generateUUID,
    getRandomBytes,
    getRGB,
    isElementInDOM,
    parsePageRanges,
    removeCssCustomProperty,
    resizeImage,
    setCssCustomProperty,
    convertToRGB,
    formatTimestamp,
    formatPDFDate
}
