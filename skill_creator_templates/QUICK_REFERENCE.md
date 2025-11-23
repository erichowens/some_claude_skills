# Skill Creator Quick Reference

## 🎯 Quick Decision Guide

**Need expertise without tools?** → Conversational Agent  
**Need to call an API?** → HTTP API Integration  
**Need custom logic?** → Custom MCP Tools

## 📋 Template Cheat Sheet

### Agent Templates

| Template | Use For | Time | Code? |
|----------|---------|------|-------|
| `technical_expert_agent.md.template` | Technical domains, engineering, data | 30-60 min | No |
| `creative_expert_agent.md.template` | Design, content, creative work | 30-60 min | No |

### MCP Server Templates

| Template | Use For | Time | Complexity |
|----------|---------|------|------------|
| `basic_mcp_server.ts.template` | Custom business logic, file ops | 4-8 hrs | Medium |
| `http_api_tool.ts.template` | REST API integrations | 2-4 hrs | Low |
| `package.json.template` | npm configuration | 5 min | None |
| `tsconfig.json.template` | TypeScript setup | 5 min | None |

## 🚀 3-Step Quick Start

### 1. Interactive (Easiest)
```
[To Agent & Skill Creator]
I want to create a skill for [your purpose]
```

### 2. Templates (Hands-on)
```bash
# Copy template
cp skill_creator_templates/agents/technical_expert_agent.md.template \
   .github/agents/my_skill.md

# Fill in {{VARIABLES}}
# Save and test!
```

### 3. Example (Learn by doing)
Read: `skill_creator_templates/examples/weather_forecast_example.md`

## 🔤 Variable Naming Conventions

| Variable Type | Example | Usage |
|---------------|---------|-------|
| `{{SKILL_NAME}}` | "Weather Forecast Expert" | Display name |
| `{{SKILL_NAME_KEBAB}}` | "weather-forecast-expert" | File names, URLs |
| `{{SKILL_NAME_SNAKE}}` | "weather_forecast" | Tool names, functions |
| `{{SKILL_NAME_PASCAL}}` | "WeatherForecast" | TypeScript types, classes |

## 📝 Common Variables

### Essential
- `{{SKILL_NAME}}` - What is it called?
- `{{DOMAIN}}` - What's the expertise area?
- `{{MISSION_STATEMENT}}` - What's the purpose?
- `{{ROLE}}` - What expert role? (e.g., "meteorologist")

### For MCP Servers
- `{{ENV_PREFIX}}` - Environment variable prefix (e.g., "WEATHER")
- `{{DEFAULT_API_URL}}` - Default API endpoint
- `{{SERVICE_NAME}}` - Service being integrated
- `{{TOOL_NAME_SNAKE}}` - Tool function name

## ⚡ File Locations

| File Type | Location | Example |
|-----------|----------|---------|
| Agent definition | `.github/agents/` | `.github/agents/code_reviewer.md` |
| MCP server | `mcp_servers/skill-name/src/` | `mcp_servers/weather/src/index.ts` |
| Server config | `mcp_servers/skill-name/` | `mcp_servers/weather/package.json` |
| Documentation | `mcp_servers/skill-name/` | `mcp_servers/weather/README.md` |

## 🛠️ Build & Test Checklist

### For Conversational Agents
- [ ] Saved to `.github/agents/skill_name.md`
- [ ] Clear mission statement
- [ ] Specific competencies defined
- [ ] Examples included
- [ ] Communication style specified

### For MCP Servers
- [ ] `package.json` filled and saved
- [ ] `tsconfig.json` configured
- [ ] `src/index.ts` implemented
- [ ] `.env.example` created
- [ ] `npm install` runs successfully
- [ ] `npm run build` completes
- [ ] Tools list correctly
- [ ] Each tool works with test data
- [ ] Error handling tested
- [ ] Added to Claude config

## 🎨 Example Skill Ideas

**Easy (Conversational)**
- SQL optimization coach
- API design consultant
- Writing style editor
- Accessibility advisor

**Medium (HTTP API)**
- Weather service
- Stock prices
- Translation service
- News aggregator
- GitHub helper

**Advanced (Custom Tools)**
- Code analyzer
- File organizer
- Database migrator
- Log parser
- Test generator

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "MCP server not found" | Use absolute path in config |
| "API key not configured" | Set in `env` section of config |
| "Tool not found" | Tool name must match exactly |
| "Build errors" | Check `npm install` ran successfully |
| "Agent not responding well" | Add more specific examples to agent definition |

## 📚 Documentation Links

- **Full Guide**: `skill_creator_templates/SKILL_CREATOR_GUIDE.md`
- **Example**: `skill_creator_templates/examples/weather_forecast_example.md`
- **Templates README**: `skill_creator_templates/README.md`
- **MCP Docs**: https://modelcontextprotocol.io/

## 💡 Pro Tips

✅ **Start simple** - Basic skill first, add complexity later  
✅ **Test early** - Build and test as you go  
✅ **Copy examples** - Learn from existing skills  
✅ **Use the creator** - Agent & Skill Creator can help  
✅ **Document well** - Future you will thank you

❌ Don't try to build everything at once  
❌ Don't skip error handling  
❌ Don't hardcode secrets  
❌ Don't forget to test edge cases

## 🎯 Success Metrics

Your skill is ready when:
- [ ] It loads without errors
- [ ] The agent understands its purpose
- [ ] Tools work with real data (if applicable)
- [ ] Documentation is clear
- [ ] You can demonstrate it to someone else
- [ ] It solves the original problem

---

**Need more help?** Ask the Agent & Skill Creator!
