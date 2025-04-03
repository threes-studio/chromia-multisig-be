import Redis from 'ioredis';

const redis: any = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0
});

async function setRedisKey(key, value) {
  try {
    await redis.set(key, value);
    // console.log(`Key: ${key} saved with value: ${value}`);
  } catch (err) {
    console.error('Error setting key:', err);
  }
}

async function getRedisKey(key): Promise<string> {
  try {
    const value = await redis.get(key);
    if (value) {
      // console.log(`Value for key ${key}: ${value}`);
      return value;
    } else {
      console.log(`No value found for key ${key}`);
      return null;
    }
  } catch (err) {
    console.error('Error getting key:', err);
    return null;
  }
}

export {
  getRedisKey, setRedisKey
};

