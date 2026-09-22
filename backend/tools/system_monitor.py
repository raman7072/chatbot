"""System Monitor Tool — Real-time hardware & OS diagnostics."""

import psutil
import platform
import datetime
from langchain_core.tools import tool


@tool
def get_system_info(component: str = "all") -> str:
    """
    Get real-time system information: CPU, RAM, disk, network, battery, OS details.
    Like the Singh Enterprises Armor HUD showing suit and core diagnostics — but for your computer.

    Args:
        component: What to monitor. Options: "all", "cpu", "memory", "disk", "network", "battery", "os"

    Returns:
        Formatted system diagnostics report.
    """
    try:
        component = component.lower().strip()
        result = "**⚙️ JARVIS System Diagnostics**\n\n"

        def _cpu_info():
            cpu_percent = psutil.cpu_percent(interval=0.5)
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            freq_str = f"{cpu_freq.current:.0f} MHz" if cpu_freq else "N/A"
            load = psutil.getloadavg()
            info = f"### 🖥️ CPU\n"
            info += f"- **Usage**: {cpu_percent}%\n"
            info += f"- **Cores**: {cpu_count} logical cores\n"
            info += f"- **Frequency**: {freq_str}\n"
            info += f"- **Load Average** (1/5/15 min): {load[0]:.2f} / {load[1]:.2f} / {load[2]:.2f}\n"
            return info

        def _memory_info():
            ram = psutil.virtual_memory()
            swap = psutil.swap_memory()
            info = f"### 🧠 Memory (RAM)\n"
            info += f"- **Total**: {ram.total / 1e9:.1f} GB\n"
            info += f"- **Used**: {ram.used / 1e9:.1f} GB ({ram.percent}%)\n"
            info += f"- **Available**: {ram.available / 1e9:.1f} GB\n"
            info += f"- **Swap**: {swap.used / 1e9:.1f} GB used of {swap.total / 1e9:.1f} GB\n"
            return info

        def _disk_info():
            info = f"### 💾 Disk\n"
            for part in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(part.mountpoint)
                    info += f"- **{part.mountpoint}** ({part.fstype}): "
                    info += f"{usage.used / 1e9:.1f} GB / {usage.total / 1e9:.1f} GB ({usage.percent}%)\n"
                except PermissionError:
                    pass
            io = psutil.disk_io_counters()
            if io:
                info += f"- **Read**: {io.read_bytes / 1e9:.2f} GB total\n"
                info += f"- **Write**: {io.write_bytes / 1e9:.2f} GB total\n"
            return info

        def _network_info():
            net_io = psutil.net_io_counters()
            info = f"### 🌐 Network\n"
            info += f"- **Bytes Sent**: {net_io.bytes_sent / 1e6:.1f} MB\n"
            info += f"- **Bytes Received**: {net_io.bytes_recv / 1e6:.1f} MB\n"
            info += f"- **Packets Sent**: {net_io.packets_sent:,}\n"
            info += f"- **Packets Received**: {net_io.packets_recv:,}\n"
            # Network interfaces
            for name, addrs in list(psutil.net_if_addrs().items())[:3]:
                for addr in addrs:
                    if addr.family.name == "AF_INET":
                        info += f"- **{name}**: {addr.address}\n"
                        break
            return info

        def _battery_info():
            battery = psutil.sensors_battery()
            info = f"### 🔋 Battery\n"
            if battery:
                status = "Charging" if battery.power_plugged else "Discharging"
                info += f"- **Level**: {battery.percent:.0f}%\n"
                info += f"- **Status**: {status}\n"
                if battery.secsleft and battery.secsleft > 0 and not battery.power_plugged:
                    mins = battery.secsleft // 60
                    info += f"- **Time Remaining**: {mins} minutes\n"
            else:
                info += "- No battery detected (desktop system)\n"
            return info

        def _os_info():
            uname = platform.uname()
            boot_time = datetime.datetime.fromtimestamp(psutil.boot_time())
            uptime = datetime.datetime.now() - boot_time
            hours, rem = divmod(int(uptime.total_seconds()), 3600)
            mins = rem // 60
            procs = len(psutil.pids())
            info = f"### 🖥️ Operating System\n"
            info += f"- **System**: {uname.system} {uname.release}\n"
            info += f"- **Machine**: {uname.machine}\n"
            info += f"- **Hostname**: {uname.node}\n"
            info += f"- **Uptime**: {hours}h {mins}m\n"
            info += f"- **Running Processes**: {procs}\n"
            info += f"- **Boot Time**: {boot_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            return info

        if component in ("all", "cpu"):
            result += _cpu_info() + "\n"
        if component in ("all", "memory", "ram"):
            result += _memory_info() + "\n"
        if component in ("all", "disk", "storage"):
            result += _disk_info() + "\n"
        if component in ("all", "network", "net"):
            result += _network_info() + "\n"
        if component in ("all", "battery"):
            result += _battery_info() + "\n"
        if component in ("all", "os", "system"):
            result += _os_info() + "\n"

        result += f"\n*Diagnostics timestamp: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*"
        return result

    except Exception as e:
        return f"System diagnostics failed: {str(e)}"
