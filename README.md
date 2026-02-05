# Tetris Online 🎮

A mobile-first, browser-based Tetris game with a playful and cute UI design.

## How to Run

### Using Docker (Recommended)

```bash
# Build and start the container
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Manual Setup

Simply open `frontend/index.html` in your browser, or serve the `frontend` directory with any static file server:

```bash
# Using Python
cd frontend && python -m http.server 8081

# Using Node.js (npx)
npx serve frontend -l 8081

# Using PHP
cd frontend && php -S localhost:8081
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Tetris Online | http://localhost:8081 | Main website and game |

## 测试账号

This is a static website with no authentication required. Simply visit the URL to play!

## 题目内容

为我在这个文件夹中有h5+js+css技术栈创建一个俄罗斯方块游戏的在线英文网站，首页要有好看的封面图，图片素材在网上找合适的图片下载下来进行引用，不要用css样式制作图片，该网站要偏向移动端，网站整体的ui风格参考手机软件的ui风格，要偏俏皮可爱一点，游戏部分的组件布局和操作方式要优先考虑移动端用户的舒适性和感受，首页中要添加一些介绍该网站主要内容和像给用户带来什么，等，这一类的文章内容，内容要优质一些。在底部添加About、Contact、Privacy Policy和Terms of Service页面，并且Privacy Policy页面要符合CCPA/COPPA法规，数据收集和使用表格，第三方服务披露（Cloudflare、Plausible Analytics），加州居民权利说明，再整理一下布局，Contact页面要求只展现电子邮箱信息，不是用户发送邮箱信息而是只展示网站的邮箱信息让用户来联系，并检查Privacy Policy页面的内容是否符合Google在线网站的审核规则，是否能够通过申请，并且Privacy Policy页面内容要符合欧盟政策。

---

## Project Structure

```
├── frontend/                 # Static website files
│   ├── css/
│   │   ├── style.css        # Main stylesheet
│   │   └── game.css         # Game page styles
│   ├── js/
│   │   ├── main.js          # Main JavaScript
│   │   └── tetris.js        # Game engine
│   ├── images/
│   │   ├── hero-banner.jpg  # Homepage hero image
│   │   └── og-image.jpg     # Open Graph image
│   ├── index.html           # Homepage
│   ├── game.html            # Game page
│   ├── about.html           # About page
│   ├── contact.html         # Contact page
│   ├── privacy.html         # Privacy Policy (GDPR/CCPA/COPPA compliant)
│   ├── terms.html           # Terms of Service
│   ├── Dockerfile           # Docker configuration
│   └── nginx.conf           # Nginx configuration
├── docs/
│   └── project_design.md    # Project design document
├── docker-compose.yml       # Docker Compose configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Features

- 📱 **Mobile-First Design**: Optimized for touchscreens with swipe controls
- 🎨 **Playful UI**: Cute, colorful design with smooth animations
- ⚡ **Instant Play**: No downloads, no sign-ups required
- 🔒 **Privacy-Focused**: GDPR, CCPA, and COPPA compliant
- 🎮 **Classic Gameplay**: Authentic Tetris experience

## Game Controls

### Mobile
- **Tap**: Rotate piece
- **Swipe Left/Right**: Move piece
- **Swipe Down**: Soft drop
- **Long Swipe Down**: Hard drop
- **On-screen buttons**: Alternative controls

### Desktop
- **Arrow Keys**: Move and rotate
- **Space**: Hard drop
- **P**: Pause/Resume

## Tech Stack

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)
- Nginx (for Docker deployment)

## License

This project is for educational purposes. Tetris® is a registered trademark of The Tetris Company.
