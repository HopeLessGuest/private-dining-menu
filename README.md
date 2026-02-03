# Lumière - High-End Digital Menu / 高端数字化菜单系统

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/react-%5E18.2.0-blue) ![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue) ![Tailwind](https://img.shields.io/badge/tailwindcss-%5E3.4.0-38bdf8)

**Lumière** is a sophisticated, web-based digital menu interface designed for fine dining restaurants, private chefs, and luxury catering. It combines the tactile elegance of traditional paper menus with the interactivity of modern web applications.

**Lumière** 是一个专为高级餐厅、私人主厨和高端餐饮设计的网页版数字化菜单界面。它完美结合了传统纸质菜单的优雅质感与现代网络应用的交互功能。

---

## ✨ Features / 功能特点

### 🎨 Elegant Design / 优雅设计
*   **Typography:** Utilizes *Cormorant Garamond* for English serif elegance and *Ma Shan Zheng* (马善政) for artistic Chinese calligraphy titles.
*   **Paper Texture Aesthetic:** Clean, document-style layout with shadows and spacing mimics a printed tasting menu.
*   **Responsive Layout:** Automatically paginates dishes (book-style) based on content.
*   **Visual Cues:** Italicized descriptions, "Chef's Special" badges, and spiciness indicators.
*   **排版:** 英文采用优雅的衬线体 *Cormorant Garamond*，中文标题采用艺术书法体 *马善政*。
*   **纸质质感:** 干净的文档式布局，配以阴影和留白，模拟高级品鉴菜单的质感。
*   **响应式布局:** 基于内容自动分页（书本式）。
*   **视觉提示:** 斜体描述、"主厨推荐"徽章以及辣度指示。

### 🛒 Interactive Cart / 交互式点单
*   **Personal Selection:** Users can select dishes and adjust quantities.
*   **Floating Cart:** A discreet floating button (Shopping Cart icon) shows the total item count.
*   **Quick View:** Expandable panel to review the selected menu list.
*   **个人精选:** 用户可以点选菜品并调整数量。
*   **悬浮购物车:** 隐蔽的悬浮按钮（购物车图标）实时显示已选数量。
*   **快速预览:** 可展开面板以回顾已选菜单列表。

### 🛠️ Menu Management (CMS) / 菜单管理系统
*   **Drag & Drop:** Easily reorder dishes and category sections using a robust drag-and-drop interface (`dnd-kit`).
*   **Live Editing:** Add, edit, toggle visibility, or delete dishes instantly.
*   **Data Persistence:** Import and Export menu data as JSON files for backup or sharing.
*   **拖拽排序:** 使用强大的拖拽接口 (`dnd-kit`) 轻松调整菜品和分类顺序。
*   **实时编辑:** 即时添加、编辑、切换可见性或删除菜品。
*   **数据持久化:** 支持导入和导出 JSON 格式的菜单数据，便于备份或分享。

### 🌐 Bilingual Support / 双语支持
*   **One-Click Switch:** Instantly toggle between English and Chinese interfaces.
*   **Contextual Translation:** All UI elements, including headers and buttons, are fully localized.
*   **一键切换:** 即时在英文和中文界面之间切换。
*   **语境翻译:** 所有界面元素（包括标题和按钮）均已完全本地化。

---

## 🛠 Tech Stack / 技术栈

*   **Core:** React 19, TypeScript
*   **Styling:** Tailwind CSS, CLSX
*   **Icons:** Lucide React
*   **Animations:** Framer Motion
*   **Drag & Drop:** @dnd-kit (Core, Sortable, Utilities)
*   **Fonts:** Google Fonts (Cormorant Garamond, Inter, Ma Shan Zheng)

---

## 🚀 Getting Started / 快速开始

### Prerequisites / 前置要求
*   Node.js (v16 or higher)
*   npm or yarn

### Installation / 安装

1.  **Clone the repository / 克隆仓库**
    ```bash
    git clone https://github.com/your-username/lumiere-menu.git
    cd lumiere-menu
    ```

2.  **Install dependencies / 安装依赖**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Start the development server / 启动开发服务器**
    ```bash
    npm start
    # or
    yarn start
    ```

4.  **Open your browser / 打开浏览器**
    Visit `http://localhost:3000` to see the menu.

---

## 📖 Usage Guide / 使用指南

### Viewing the Menu / 浏览菜单
*   Scroll through the pages to view dishes.
*   Click the **Language Switcher** (Top Right) to change languages.
*   Click the **Directory** (Left Sidebar) to quickly jump to a specific category.
*   滚动页面浏览菜品。
*   点击右上角的 **语言切换器** 更改语言。
*   点击左侧的 **目录** 快速跳转到特定分类。

### Managing the Menu / 管理菜单
1.  Click the **Settings Icon** on the top left of the screen to open the **Management Panel**.
2.  **Add Dish:** Click the "+ Add Dish" button.
3.  **Edit:** Click on any dish in the list to expand editing details (Name, Description, Price, Video URL, Featured status).
4.  **Reorder:** Drag dishes to reorder them within a category, or drag entire Category Sections to reorder the flow of the menu.
5.  **Export/Import:** Use the download/upload icons to save your menu configuration.
1.  点击屏幕左上角的 **设置图标** 打开 **管理面板**。
2.  **添加菜品:** 点击 "+ 新菜品" 按钮。
3.  **编辑:** 点击列表中的任意菜品展开编辑详情（名称、描述、价格、视频链接、推荐状态）。
4.  **排序:** 拖拽菜品调整类目内顺序，或拖拽整个分类板块调整菜单流程。
5.  **导出/导入:** 使用下载/上传图标保存您的菜单配置。

---

## 📄 License / 许可证

This project is licensed under the MIT License.
本项目采用 MIT 许可证。
