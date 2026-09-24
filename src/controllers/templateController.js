const { getAllTemplatesList, getTemplatePath, getTemplateInfo } = require('../services/templateService');
const path = require('path');
const fs = require('fs');

exports.getTemplates = (req, res) => {
  const templates = getAllTemplatesList();
  res.render('admin/templates', {
    title: 'Tải File Mẫu Import Câu Hỏi',
    templates
  });
};

exports.downloadTemplate = (req, res) => {
  const { gameType } = req.params;
  const filePath = getTemplatePath(gameType);
  const info = getTemplateInfo(gameType);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Không tìm thấy tệp mẫu tương ứng.');
  }

  res.download(filePath, info ? info.filename : `template_${gameType}.xlsx`);
};
