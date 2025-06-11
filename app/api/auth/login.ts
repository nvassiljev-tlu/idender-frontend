import { NextApiRequest, NextApiResponse } from 'next'
import mysql from 'mysql2/promise'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  try {
    // create a connection to the database
    const connection = await mysql.createConnection({
      host: 'your-database-host',
      user: 'your-database-user',
      password: 'your-database-password',
      database: 'idender_stage',
    })

    // query the users table
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    )

    await connection.end()

    if (Array.isArray(rows) && rows.length > 0) {
      //might want to implement proper password hashing comparison
      const user = rows[0]
      return res.status(200).json({ user })
    } else {
      // no user found
      return res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Database error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
