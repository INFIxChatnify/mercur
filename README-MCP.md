# MCP PostgreSQL Setup

## การติดตั้ง
ติดตั้ง MCP PostgreSQL server แล้ว:
```bash
npm install @modelcontextprotocol/server-postgres
```

## การตั้งค่า
1. **mcp.json** - ไฟล์ config หลักสำหรับ MCP
2. **.env.mcp** - ไฟล์เก็บ credentials (ควรเพิ่มใน .gitignore)

## การใช้งาน
MCP server จะเชื่อมต่อกับ PostgreSQL database ที่:
- Host: localhost
- Port: 5432
- Database: postgres
- User: root
- Password: 12345678

## คำสั่งที่ใช้ได้
เมื่อใช้งานกับ Claude หรือ MCP client อื่นๆ คุณสามารถ:
- Query ข้อมูลจาก database
- ดู schema ของ tables
- Run SQL queries
- ดูข้อมูลใน database

## การรัน MCP Server
```bash
npx @modelcontextprotocol/server-postgres postgresql://root:12345678@localhost:5432/postgres
```