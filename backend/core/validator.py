def detect_cycle(courses):
    """
    DFS with three-color marking to find all cycles in the prerequisite graph.
    Returns a list of cycle paths (each path is a list of course codes).
    """
    color = {code: 0 for code in courses}  # 0=unvisited, 1=in-stack, 2=done
    cycles = []

    def dfs(node, path):
        color[node] = 1
        path.append(node)
        for req in courses.get(node, {}).get("req", []):
            if req not in courses:
                continue
            if color[req] == 1:
                cycle_start = path.index(req)
                cycles.append(path[cycle_start:] + [req])
            elif color[req] == 0:
                dfs(req, path)
        path.pop()
        color[node] = 2

    for code in courses:
        if color[code] == 0:
            dfs(code, [])

    return cycles
