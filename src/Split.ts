import * as fs from 'fs/promises';
import { log } from './utils';
import path from 'path';

interface SplitResult {
  content: string;
  wordCount: number;
}

export class TextSplitter {
  private readonly maxTokens: number;
  private readonly minTokens: number;

  constructor(
    maxTokens = 256, 
    minTokens = 50,
  ) {
    this.maxTokens = maxTokens;
    this.minTokens = minTokens;
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      const extension = path.extname(filePath).toLowerCase();
      switch (extension) {
          case '.txt':
          case '.md':
              return await fs.readFile(filePath, 'utf-8');
          default:
              throw new Error(`不支持的文件类型: ${extension}`);
      }
    } catch (error) {
      console.error('读取文件失败:', error);
      throw error;
    }
  }

  /**
   * 中文: 每个字符计为一个词
   * 英文: 按空格分割计数
   */
  private countWords(text: string): number {
    const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    
    return chineseCount + englishWords;
  }

  // 匹配符号按句子 split
  private splitIntoSentences(text: string): string[] {
    const sentenceDelimiters = /(?<=[。.!?！？])\s*/g;
    return text.split(sentenceDelimiters).filter(s => s.trim().length > 0);
  }

    /**
   * 简单估算文本的token数量
   * 1. 中文字符算1个token
   * 2. 英文单词算1个token
   * 3. 标点符号和空格也计入
   */
  private estimateTokenCount(text: string): number {
    // 筛选常用汉字 unicode
    const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 移除中文字符和空白字符
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
      const content = await this.readFile(filePath);
      const sentences = this.splitIntoSentences(content);
      const chunks = this.mergeSentences(sentences);
      log('SPLIT FILE SUCCESS')
      return chunks;
    } catch (error) {
      console.error('splitFile err:', error);
      throw error;
    }
  }
}
