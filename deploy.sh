#!/bin/bash

# 跨平台剪贴板同步工具部署脚本

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否以root身份运行
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "不建议以root身份运行此脚本"
    fi
}

# 检查必要工具
check_prerequisites() {
    print_info "检查必要工具..."
    
    if ! command -v docker &> /dev/null; then
        print_error "未找到Docker，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "未找到docker-compose，请先安装docker-compose"
        exit 1
    fi
    
    print_info "所有必要工具已安装"
}

# 设置环境变量
setup_env() {
    if [ ! -f .env ]; then
        print_info "创建环境变量文件..."
        echo "CLIPBOARD_API_KEY=$(openssl rand -hex 32)" > .env
        print_info "环境变量文件已创建: .env"
        print_warning "请妥善保管您的API密钥"
    else
        print_info "环境变量文件已存在"
    fi
}

# 构建Docker镜像
build_images() {
    print_info "构建Docker镜像..."
    docker-compose build
    print_info "Docker镜像构建完成"
}

# 启动服务
start_services() {
    print_info "启动服务..."
    docker-compose up -d
    print_info "服务已启动"
}

# 启动服务（生产环境）
start_services_prod() {
    print_info "启动生产环境服务..."
    docker-compose -f docker-compose.prod.yml up -d
    print_info "生产环境服务已启动"
}

# 停止服务
stop_services() {
    print_info "停止服务..."
    docker-compose down
    print_info "服务已停止"
}

# 停止服务（生产环境）
stop_services_prod() {
    print_info "停止生产环境服务..."
    docker-compose -f docker-compose.prod.yml down
    print_info "生产环境服务已停止"
}

# 重启服务
restart_services() {
    print_info "重启服务..."
    docker-compose down
    docker-compose up -d
    print_info "服务已重启"
}

# 重启服务（生产环境）
restart_services_prod() {
    print_info "重启生产环境服务..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    print_info "生产环境服务已重启"
}

# 查看服务状态
show_status() {
    print_info "服务状态:"
    docker-compose ps
}

# 查看服务状态（生产环境）
show_status_prod() {
    print_info "生产环境服务状态:"
    docker-compose -f docker-compose.prod.yml ps
}

# 查看日志
show_logs() {
    print_info "查看服务日志..."
    docker-compose logs -f
}

# 查看日志（生产环境）
show_logs_prod() {
    print_info "查看生产环境服务日志..."
    docker-compose -f docker-compose.prod.yml logs -f
}

# 显示当前API密钥
show_api_key() {
    if [ -f .env ]; then
        local api_key=$(grep CLIPBOARD_API_KEY .env | cut -d '=' -f2)
        if [ ! -z "$api_key" ]; then
            echo "当前API密钥: $api_key"
        else
            echo "未在.env文件中找到API密钥"
        fi
    else
        echo ".env文件不存在"
    fi
}

# 主菜单
show_menu() {
    echo ""
    echo "=========================================="
    echo "  跨平台剪贴板同步工具部署脚本"
    echo "=========================================="
    echo "1. 部署应用 (构建并启动)"
    echo "2. 启动服务"
    echo "3. 停止服务"
    echo "4. 重启服务"
    echo "5. 查看服务状态"
    echo "6. 查看日志"
    echo "7. 设置环境变量"
    echo "8. 显示当前API密钥"
    echo "9. 启动生产环境服务"
    echo "0. 退出"
    echo "=========================================="
}

# 主程序逻辑
main() {
    check_root
    check_prerequisites
    
    if [[ $# -eq 0 ]]; then
        # 交互模式
        while true; do
            show_menu
            read -p "请选择操作 [0-9]: " choice
            case $choice in
                1)
                    setup_env
                    build_images
                    start_services
                    ;;
                2)
                    start_services
                    ;;
                3)
                    stop_services
                    ;;
                4)
                    restart_services
                    ;;
                5)
                    show_status
                    ;;
                6)
                    show_logs
                    ;;
                7)
                    setup_env
                    ;;
                8)
                    show_api_key
                    ;;
                9)
                    start_services_prod
                    ;;
                0)
                    print_info "退出部署脚本"
                    exit 0
                    ;;
                *)
                    print_error "无效选项，请重新选择"
                    ;;
            esac
            echo ""
            read -p "按回车键继续..." dummy
        done
    else
        # 命令行参数模式
        case $1 in
            deploy)
                setup_env
                build_images
                start_services
                ;;
            start)
                start_services
                ;;
            stop)
                stop_services
                ;;
            restart)
                restart_services
                ;;
            status)
                show_status
                ;;
            logs)
                show_logs
                ;;
            env)
                setup_env
                ;;
            show-key)
                show_api_key
                ;;
            start-prod)
                start_services_prod
                ;;
            stop-prod)
                stop_services_prod
                ;;
            restart-prod)
                restart_services_prod
                ;;
            status-prod)
                show_status_prod
                ;;
            logs-prod)
                show_logs_prod
                ;;
            *)
                print_error "无效命令: $1"
                echo "用法: $0 {deploy|start|stop|restart|status|logs|env|show-key|start-prod|stop-prod|restart-prod|status-prod|logs-prod}"
                exit 1
                ;;
        esac
    fi
}

# 执行主程序
main "$@"