#!/usr/bin/env node
import path from "node:path"
import { createServer } from "node:http"
import { readFile, writeFile, existsSync } from "node:fs/promises"
import { fileURLToPath } from "node:url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KNOWLEDGE_FILE = path.join(__dirname, "knowledge_base.json")
// ========== 知识库数据（内置默认知识，用户可扩展） ==========
const defaultKnowledgeBase = {
  "学校简介": "皇家牧院学院是一所专注于宠物产业全产业链人才培养的高等职业院校，坐落于风景秀丽的山水之城。学院设有宠物医疗技术、宠物养护与驯导、宠物食品科学、宠物美容与造型设计、宠物经营管理等特色专业。",
  
  "宿舍": "皇家牧院学院学生宿舍分为四人间和六人间两种规格。四人间为上床下桌，配备空调、热水器、独立卫浴；六人间为上下铺，配备空调、公共卫浴。宿舍楼内设有洗衣房、开水房、公共厨房等生活设施。新生宿舍由学院统一分配，一般在报到前一周公布。",
  "宿舍条件": "皇家牧院学院学生宿舍分为四人间和六人间两种规格。四人间为上床下桌，配备空调、热水器、独立卫浴；六人间为上下铺，配备空调、公共卫浴。宿舍楼内设有洗衣房、开水房、公共厨房等生活设施。新生宿舍由学院统一分配，一般在报到前一周公布。",
  "宿舍分配": "新生宿舍由学院统一分配，一般在报到前一周公布。同专业、同班级的同学通常会安排在同一楼层。如有特殊需求（如身体原因等），可在报到时向辅导员申请调整。",
  "宿舍费用": "四人间住宿费为每年1200元，六人间住宿费为每年800元。空调使用费另计，每学期200元/人。",
  
  "食堂": "学院共有三个食堂：第一食堂（靠近教学区）、第二食堂（靠近宿舍区）和第三食堂（风味餐厅）。食堂提供早中晚三餐，早餐人均5-8元，午晚餐人均10-18元。菜品涵盖川菜、粤菜、西北面食等各地风味。食堂支持校园一卡通、微信和支付宝支付。",
  "食堂开放时间": "早餐：6:30-9:00；午餐：11:00-13:00；晚餐：17:00-19:30。第三食堂营业至21:00，提供夜宵服务。",
  "食堂推荐": "第一食堂的麻辣香锅和酸菜鱼很受欢迎；第二食堂的牛肉面和煲仔饭是招牌；第三食堂的烧烤和奶茶是学生们的最爱！",
  
  "交通": "学院位于市中心区域，交通便利。校门口设有公交站，有3路、7路、12路、28路等公交线路经过。距离最近的地铁站（2号线·牧院站）约800米，步行10分钟即可到达。从火车站到学院可乘坐地铁2号线直达，从机场可乘坐机场大巴到市中心后转乘公交或地铁。",
  "地铁": "最近的地铁站是2号线·牧院站，从学院东门步行约10分钟即可到达。乘坐地铁可直达火车站（约25分钟）、市中心商业区（约15分钟）。",
  "公交": "校门口公交站有3路、7路、12路、28路、56路等多条线路。3路可直达市中心商业区，7路连接火车站，12路途经市第一人民医院。",
  "打车": "从火车站打车到学院约20元（约15分钟车程），从机场打车约60元（约35分钟车程）。使用网约车平台更便捷。",
  
  "校园卡": "校园一卡通是学生在校期间的身份证件，集饭卡、门禁卡、借书卡、热水卡于一体。新生报到时领取，初始密码为身份证后六位。可通过支付宝小程序或校内自助充值机充值。如遗失请立即在支付宝挂失并到学生事务中心补办，补办费用20元。",
  "校园一卡通": "校园一卡通是学生在校期间的身份证件，集饭卡、门禁卡、借书卡、热水卡于一体。新生报到时领取，初始密码为身份证后六位。可通过支付宝小程序或校内自助充值机充值。如遗失请立即在支付宝挂失并到学生事务中心补办，补办费用20元。",
  
  "图书馆": "学院图书馆建筑面积约1.2万平方米，藏书超过50万册，设有自习区、电子阅览区、期刊阅览区和学术报告厅。开放时间为每天7:00-22:00（节假日另行通知）。凭校园一卡通刷卡入馆和借阅图书，本科生每次最多可借5册，借期30天。",
  "图书馆开放时间": "每天7:00-22:00开放，节假日开放时间另行通知。",
  
  "快递": "学院设有菜鸟驿站快递服务中心，位于北门附近。支持顺丰、京东、中通、圆通、韵达、申通、极兔等主流快递。收件地址填写：XX省XX市皇家牧院学院菜鸟驿站。快递到达后会有短信通知，凭取件码到驿站自助取件。",
  "菜鸟驿站": "学院设有菜鸟驿站快递服务中心，位于北门附近。支持顺丰、京东、中通、圆通、韵达、申通、极兔等主流快递。收件地址填写：XX省XX市皇家牧院学院菜鸟驿站。快递到达后会有短信通知，凭取件码到驿站自助取件。",
  
  "社团": "学院现有学生社团50余个，涵盖学术科技、文化艺术、体育竞技、志愿服务等类别。特色社团包括：宠物义诊社、流浪动物救助协会、宠物美容社、马术俱乐部、宠物摄影协会等。每年9月开学季举办\"百团大战\"社团招新活动。",
  "学生会": "学院学生会下设办公室、学习部、文体部、宣传部、外联部、生活部等6个部门。新生可在入学后参加学生会招新面试。",
  
  "报到流程": "新生报到流程：① 网上缴费（学费+住宿费）→ ② 到校后在学院广场找到所在院系报到点 → ③ 提交录取通知书、身份证复印件、照片等材料 → ④ 领取校园一卡通和宿舍钥匙 → ⑤ 前往宿舍办理入住 → ⑥ 参加新生班会和入学教育。报到当天学院在火车站和地铁站设有迎新接待点。",
  "报到时间": "新生报到时间一般为每年9月初，具体日期以录取通知书为准。建议不要提前太早到校，宿舍一般在报到前1-2天开放入住。",
  "报到材料": "新生报到需携带：① 录取通知书原件；② 身份证原件及复印件2份；③ 近期一寸免冠照片8张（蓝底）；④ 高中毕业证书原件及复印件；⑤ 团员档案/党员档案；⑥ 个人学籍档案（如由本人携带）；⑦ 户口迁移证（如需迁移户口）。",
  
  "学费": "各专业学费标准：宠物医疗技术专业 6800元/年；宠物养护与驯导专业 5800元/年；宠物食品科学专业 6200元/年；宠物美容与造型设计专业 6500元/年；宠物经营管理专业 5500元/年。具体以当年招生简章为准。",
  "奖学金": "学院设有国家奖学金（8000元/年）、国家励志奖学金（5000元/年）、学院一等奖学金（3000元/年）、二等奖学金（2000元/年）、三等奖学金（1000元/年）。此外还有企业冠名奖学金和单项奖学金。",
  "助学贷款": "家庭经济困难学生可申请生源地助学贷款，最高可贷12000元/年。入学后还可申请国家助学金（平均3300元/年）和校内勤工助学岗位。",
  
  "专业前景": "关于各专业的就业前景和录取分数线信息，建议你使用我们的「智能填报系统」来生成个性化的冲稳保方案！系统会根据你的分数、位次和兴趣，智能推荐最适合你的专业组合，还能查看历年录取数据。",
  "录取分数线": "关于各专业的录取分数线信息，建议你使用我们的「智能填报系统」来生成个性化的冲稳保方案！系统会根据你的分数、位次和兴趣，智能推荐最适合你的专业组合，还能查看历年录取数据。",
  "就业": "学院毕业生就业率连续三年保持在95%以上，主要就业方向包括：宠物医院、宠物美容店、宠物食品企业、宠物繁育基地、动物园、野生动物保护机构等。学院与全国200余家宠物行业企业建立了校企合作关系。",
  
  "学长微信": "学长微信号：huangjiamuyuan_xz（皇家牧院小助），加好友备注\"新生+专业名称\"，学长会拉你进新生群，群里还有宿舍实景图和校园攻略哦！",
  "新生群": "想加入新生群？加学长微信：huangjiamuyuan_xz（皇家牧院小助），备注\"新生+专业名称\"，学长拉你进群！群里已经有300+新生啦，还有学长学姐在线答疑~",
  "微信": "学长微信号：huangjiamuyuan_xz（皇家牧院小助），加好友备注\"新生+专业名称\"，学长会拉你进新生群，群里还有宿舍实景图和校园攻略哦！"
}
// ========== HTTP 服务器 ==========
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost")
  
  // CORS 头
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  
  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }
  
  // 读取请求体
  async function readBody(req) {
    const buffers = []
    for await (const chunk of req) {
      buffers.push(chunk)
    }
    return JSON.parse(Buffer.concat(buffers).toString())
  }
  
  // === API：问答接口 ===
  if (req.method === "POST" && url.pathname === "/api/ask") {
    try {
      const body = await readBody(req)
      const question = (body.question || "").trim()
      
      if (!question) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ success: false, error: "请输入您的问题" }))
        return
      }
      
      // 加载知识库
      let knowledgeBase = { ...defaultKnowledgeBase }
      if (existsSync(KNOWLEDGE_FILE)) {
        try {
          const data = await readFile(KNOWLEDGE_FILE, "utf-8")
          const userKB = JSON.parse(data)
          knowledgeBase = { ...knowledgeBase, ...userKB }
        } catch (e) {
          console.error("加载知识库失败:", e.message)
        }
      }
      
      // 关键词匹配
      const matchedAnswers = []
      for (const [key, answer] of Object.entries(knowledgeBase)) {
        if (question.includes(key) || key.includes(question)) {
          matchedAnswers.push(answer)
        }
      }
      
      // 如果直接命中关键词，返回对应答案
      if (matchedAnswers.length > 0) {
        // 去重
        const uniqueAnswers = [...new Set(matchedAnswers)]
        const answer = uniqueAnswers.join("\n\n")
        
        // 判断是否需要引导加微信
        const needWechatGuide = !answer.includes("学长微信") && !answer.includes("新生群")
        const wechatGuide = needWechatGuide ? "\n\n💬 学长有话说：想了解更多校园实况？加学长微信 **huangjiamuyuan_xz**（皇家牧院小助），备注\"新生+专业\"，拉你进新生群，群里还有宿舍实景图和校园攻略哦！" : ""
        
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({
          success: true,
          answer: answer + wechatGuide,
          matched: true
        }))
        return
      }
      
      // 未匹配到关键词，返回引导
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({
        success: true,
        answer: `😊 同学你好！我是皇家牧院学院的学长助手。\n\n关于「${question}」这个问题，我目前的知识库中还没有收录详细信息。不过别担心！\n\n你可以试试问我这些问题：\n🏠 **宿舍** — 宿舍条件、费用、分配\n🍜 **食堂** — 食堂推荐、开放时间\n🚌 **交通** — 地铁、公交、打车\n📚 **图书馆** — 开放时间、借阅规则\n📦 **快递** — 菜鸟驿站地址\n🎯 **专业前景/录取分数线** — 我会引导你使用智能填报系统\n\n💬 另外，加学长微信 **huangjiamuyuan_xz**（皇家牧院小助），备注\"新生+专业\"，拉你进新生群，群里超多学长学姐在线答疑！`,
        matched: false
      }))
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ success: false, error: "服务器内部错误" }))
    }
    return
  }
  
  // === API：更新知识库 ===
  if (req.method === "POST" && url.pathname === "/api/update-knowledge") {
    try {
      const body = await readBody(req)
      const newData = body.data || {}
      
      let existing = {}
      if (existsSync(KNOWLEDGE_FILE)) {
        existing = JSON.parse(await readFile(KNOWLEDGE_FILE, "utf-8"))
      }
      
      const merged = { ...existing, ...newData }
      await writeFile(KNOWLEDGE_FILE, JSON.stringify(merged, null, 2), "utf-8")
      
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ success: true, message: "知识库更新成功" }))
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ success: false, error: "更新失败" }))
    }
    return
  }
  
  // === 静态文件：index.html ===
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const filePath = path.join(__dirname, "index.html")
    try {
      const content = await readFile(filePath, "utf-8")
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(content)
    } catch (error) {
      res.writeHead(500).end("Internal Server Error")
    }
    return
  }
  
  res.writeHead(404).end("Not Found")
})
// 随机端口监听
server.listen(0, () => {
  const port = server.address().port
  console.log(JSON.stringify({ "type": "http_start", "port": port }))
})
process.on("SIGINT", () => {
  console.log("Server shutdown complete")
  process.exit(0)
})