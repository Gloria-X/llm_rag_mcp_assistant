import * as fs from 'fs/promises';
import { log } from './utils';

interface SplitResult {
  content: string;
  wordCount: number;
}

export class TextSplitter {
  private readonly maxTokens: number;
  private readonly minTokens: number;
  private readonly overlap: number;
  private readonly avgCharsPerToken: number = 3;

  constructor(maxTokens = 256, minTokens = 50, overlap = 20) {
    this.maxTokens = maxTokens;
    this.minTokens = minTokens;
    this.overlap = overlap;
  }

  // 读取文件内容
  private async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('读取文件失败:', error);
      throw error;
    }
  }

  // 计算文本字数
  private countWords(text: string): number {
    // 对于中文，每个字符计为一个词
    // 对于英文，按空格分割计数
    const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    
    return chineseCount + englishWords;
  }

  // 按句子分割文本
  private splitIntoSentences(text: string): string[] {
    // 匹配中文句号、英文句号、感叹号、问号等作为句子分隔符
    const sentenceDelimiters = /(?<=[。.!?！？])\s*/g;
    return text.split(sentenceDelimiters).filter(s => s.trim().length > 0);
  }

  // 估算文本的token数量
  private estimateTokenCount(text: string): number {
    // 简单估算：
    // 1. 中文字符算1个token
    // 2. 英文单词算1个token
    // 3. 标点符号和空格也计入
    const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    
    return chineseCount + englishWords;
  }

  // 合并短句子
  private mergeSentences(sentences: string[]): SplitResult[] {
    const chunks: SplitResult[] = [];
    let currentChunk = '';
    let currentTokenCount = 0;

    for (const sentence of sentences) {
      const sentenceTokenCount = this.estimateTokenCount(sentence);
      
      if (currentTokenCount + sentenceTokenCount > this.maxTokens && currentChunk) {
        // 如果当前块加上新句子超过最大token数，保存当前块
        chunks.push({
          content: currentChunk.trim(),
          wordCount: this.countWords(currentChunk)
        });
        
        // 保留一部分重叠内容
        const lastSentences = currentChunk.split(/[。.!?！？]/g).slice(-2).join('。');
        currentChunk = lastSentences + sentence;
        currentTokenCount = this.estimateTokenCount(currentChunk);
      } else {
        // 否则继续添加到当前块
        currentChunk += sentence;
        currentTokenCount += sentenceTokenCount;
      }

      // 如果当前块token数太小，继续添加
      if (currentTokenCount < this.minTokens) {
        continue;
      }
    }

    // 处理最后一个块
    if (currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        wordCount: this.countWords(currentChunk)
      });
    }

    return chunks;
  }

  public async splitFile(filePath: string): Promise<SplitResult[]> {
    try {
      // 读取文件
      const content = await this.readFile(filePath);
      // 按句子分割
      const sentences = this.splitIntoSentences(content);
      // 合并句子成块
      const chunks = this.mergeSentences(sentences);
      log('SPLIT FILE SUCCESS')
      return chunks;
    } catch (error) {
      console.error('splitFile err:', error);
      throw error;
    }
  }
}
