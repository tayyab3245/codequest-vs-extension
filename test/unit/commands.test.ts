/**
 * CodeQuest - VS Code LeetCode Progress Tracker
 * 
 * Copyright (c) 2025 tayyab3245. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized reproduction,
 * distribution, or modification is strictly prohibited. See LICENSE file
 * for full terms and conditions.
 * 
 * @author tayyab3245
 * @license Proprietary
 */
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

describe('Commands Configuration', () => {
  let packageJson: any;

  beforeEach(() => {
    const packagePath = path.join(__dirname, '..', '..', 'package.json');
    const content = fs.readFileSync(packagePath, 'utf8');
    packageJson = JSON.parse(content);
  });

  describe('package.json contributions', () => {
    it('should include codequest.previewUiState command', () => {
      const commands = packageJson.contributes?.commands || [];
      const previewCommand = commands.find((cmd: any) => cmd.command === 'codequest.previewUiState');
      
      expect(previewCommand).to.exist;
      expect(previewCommand.title).to.equal('CodeQuest: Preview UI State');
    });

    it('should include onCommand:codequest.previewUiState in activationEvents', () => {
      const activationEvents = packageJson.activationEvents || [];
      expect(activationEvents).to.include('onCommand:codequest.previewUiState');
    });
  });
});
