
import pg from 'pg'
import "dotenv/config"

// https://node-postgres.com/apis/client
const { Client } = pg
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? +process.env.DB_PORT : 5432,
});

await client.connect()

interface DatabaseOperations<T> {
  create(item: T): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  update(id: number, item: T): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

interface Entity {
  id?: number;
  [key: string]: any;
}

export class PostgresDB<T extends Entity> implements DatabaseOperations<T> {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async create(item: T): Promise<T> {
    const keys = Object.keys(item);
    const values = Object.values(item);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');

    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await client.query(query, values);
      return result.rows[0] as T;
    } catch (error) {
      console.error('创建记录失败:', error);
      throw error;
    }
  }

  async findAll(): Promise<T[]> {
    const query = `SELECT * FROM ${this.tableName}`;
    
    try {
      const result = await client.query(query);
      return result.rows as T[];
    } catch (error) {
      console.error('查询所有记录失败:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<T | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE id = $1
    `;

    try {
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('查询单条记录失败:', error);
      throw error;
    }
  }

  async update(id: number, item: T): Promise<T | null> {
    const keys = Object.keys(item);
    const values = Object.values(item);
    const setClause = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;

    try {
      const result = await client.query(query, [...values, id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('更新记录失败:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await client.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('删除记录失败:', error);
      throw error;
    }
  }
}

export const createPostgresDB = <T extends Entity>(tableName: string) => {
  return new PostgresDB<T>(tableName);
};