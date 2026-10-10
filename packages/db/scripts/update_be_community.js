const fs = require('fs');
const path = require('path');

// 1. Update connect-app.service.ts
const serviceFile = path.resolve(__dirname, '../../apps/vione_app_be/src/connect-app/connect-app.service.ts');
let serviceContent = fs.readFileSync(serviceFile, 'utf8');

// Add 1f lookup in nfcTap
if (!serviceContent.includes('// 1f. Check public.vione_users')) {
  const targetSpot = '    // Không tìm thấy user hợp lệ\n    if (!targetUserId) {';
  const addition = `    // 1f. Check public.vione_users by username or email
    if (!targetUserId) {
      try {
        const u = await this.prisma.$queryRaw<any[]>\`
          SELECT id FROM public.vione_users
          WHERE username = \${cleanToken} OR email = \${cleanToken} OR id::text = \${cleanToken}
          LIMIT 1
        \`;
        if (u.length > 0) {
          targetUserId = u[0].id;
        }
      } catch {}
    }

    // 1g. Check public.members by phone or name
    if (!targetUserId) {
      try {
        const m = await this.prisma.$queryRaw<any[]>\`
          SELECT id, user_id FROM public.members
          WHERE phone = \${cleanToken} OR email = \${cleanToken} OR id = \${cleanToken}
          LIMIT 1
        \`;
        if (m.length > 0) {
          targetUserId = m[0].user_id || m[0].id;
          foundMember = m[0];
        }
      } catch {}
    }

    // Không tìm thấy user hợp lệ
    if (!targetUserId) {`;
  serviceContent = serviceContent.replace(targetSpot, addition);
}

// Add executiveRole and department to profile return
if (!serviceContent.includes('executiveRole: foundMember?.executive_role')) {
  serviceContent = serviceContent.replace(
    'primaryCardSlug: foundCard?.slug || null,',
    `primaryCardSlug: foundCard?.slug || null,
      executiveRole: foundMember?.executive_role || (foundMember?.id ? 'member' : null),
      department: foundMember?.department || 'CLB Doanh Nhân CEO 1983',
      association: 'CLB Doanh Nhân CEO 1983 - HanoiBA',
      skills: ['Quản trị doanh nghiệp', 'Xúc tiến thương mại', 'Kết nối B2B', 'Chiến lược dòng tiền'],
      talents: foundMember?.executive_role ? \`Lãnh đạo \${foundMember?.department || 'Ban'} CLB CEO 1983\` : 'Doanh nhân hội viên chính thức',
      verifiedBadge: true,`
  );
}

// Add createCommunityOpportunity and createCommunityNews methods
if (!serviceContent.includes('async createCommunityOpportunity(')) {
  const marker = '  async claimCommunityOpportunity(userId: string, communityId: string, opportunityRef: string) {';
  const newMethods = `  async createCommunityOpportunity(userId: string, communityId: string, data: any) {
    const oppId = \`OPP-\${Date.now().toString(36).toUpperCase()}\`;
    const member = await this.prisma.$queryRaw<any[]>\`
      SELECT id, name, phone, company FROM public.members 
      WHERE user_id = \${userId}::uuid OR id = \${userId}
      LIMIT 1
    \`.catch(() => [] as any[]);
    const posterName = member[0]?.name || 'Hội viên VIONE';

    await this.prisma.$executeRaw\`
      INSERT INTO public.opportunities (
        id, association_id, poster_id, title, description, type,
        budget_min, budget_max, region, industry, deadline, status, views, emoji, created_at
      ) VALUES (
        \${oppId}, \${communityId}::uuid, \${userId}, \${data.title || 'Cơ hội hợp tác mới'},
        \${data.description || ''}, \${data.type || 'opp.type.partnership'},
        \${data.budgetMin ? BigInt(data.budgetMin) : BigInt(0)},
        \${data.budgetMax ? BigInt(data.budgetMax) : BigInt(0)},
        \${data.region || 'Toàn quốc'}, \${data.industry || 'Đa ngành'},
        \${data.deadline ? new Date(data.deadline) : new Date(Date.now() + 30 * 86400000)},
        'open', 0, \${data.emoji || '🤝'}, now()
      )
    \`;

    return {
      ok: true,
      opportunityId: oppId,
      title: data.title,
    };
  }

  async createCommunityNews(userId: string, communityId: string, data: any) {
    const newsId = \`NEWS-\${Date.now().toString(36).toUpperCase()}\`;
    const code = \`N\${Date.now().toString().slice(-6)}\`;
    const member = await this.prisma.$queryRaw<any[]>\`
      SELECT name FROM public.members 
      WHERE user_id = \${userId}::uuid OR id = \${userId}
      LIMIT 1
    \`.catch(() => [] as any[]);
    const authorName = member[0]?.name || 'Ban Thư Ký';

    await this.prisma.$executeRaw\`
      INSERT INTO public.news (
        id, code, title, category, author, published_at, views, status, excerpt, content, cover_image, association_id, created_at, updated_at
      ) VALUES (
        \${newsId}, \${code}, \${data.title || 'Thông báo mới'},
        \${data.category || 'Tin Hiệp Hội'}, \${authorName},
        now(), 0, 'published', \${data.excerpt || ''},
        \${data.content || ''}, \${data.coverImage || '/ceo1983_hero_cosmos_skyline.jpg'},
        \${communityId}::uuid, now(), now()
      )
    \`;

    return {
      ok: true,
      newsId,
      title: data.title,
    };
  }

  async claimCommunityOpportunity(userId: string, communityId: string, opportunityRef: string) {`;
  serviceContent = serviceContent.replace(marker, newMethods);
}

fs.writeFileSync(serviceFile, serviceContent, 'utf8');
console.log('connect-app.service.ts updated successfully!');

// 2. Update community.controller.ts
const ctrlFile = path.resolve(__dirname, '../../apps/vione_app_be/src/connect-app/community.controller.ts');
let ctrlContent = fs.readFileSync(ctrlFile, 'utf8');

if (!ctrlContent.includes('async createCommunityOpportunity(')) {
  const ctrlMarker = `  @Post(':communityId/opportunities/:opportunityRef/claim')`;
  const addition = `  @Post(':communityId/opportunities')
  @UseGuards(JwtAuthGuard)
  async createCommunityOpportunity(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() body: any,
  ) {
    return this.connectAppService.createCommunityOpportunity(req.user.id, communityId, body);
  }

  @Post(':communityId/news')
  @UseGuards(JwtAuthGuard)
  async createCommunityNews(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() body: any,
  ) {
    return this.connectAppService.createCommunityNews(req.user.id, communityId, body);
  }

  @Post(':communityId/opportunities/:opportunityRef/claim')`;
  ctrlContent = ctrlContent.replace(ctrlMarker, addition);
  fs.writeFileSync(ctrlFile, ctrlContent, 'utf8');
  console.log('community.controller.ts updated successfully!');
}
