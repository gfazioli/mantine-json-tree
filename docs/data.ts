export interface PackageData {
  /** Package name as in npm, for example, `mantine-extension-template` */
  packageName: string;

  /** Description of the package, displayed below the title in documentation */
  packageDescription: string;

  /** Link to the documentation mdx file, used in "Edit this page button" */
  mdxFileUrl: string;

  /** Link to the repository on GitHub, used in header github icon and in "View source code button" */
  repositoryUrl: string;

  /** Link to the license file */
  licenseUrl?: string;

  /** Information about the author of the package */
  author: {
    /** Package author name, for example, `John Doe` */
    name: string;

    /** Author GitHub username, for example, `rtivital` */
    githubUsername: string;
  };
}

export const PACKAGE_DATA: PackageData = {
  packageName: '@gfazioli/mantine-spinner',
  packageDescription:
    'A Mantine React component offers customizable loading animations to enhance the user experience in React applications.',
  mdxFileUrl: 'https://github.com/gfazioli/mantine-spinner/blob/master/docs/docs.mdx',
  repositoryUrl: 'https://github.com/gfazioli/mantine-spinner',
  licenseUrl: 'https://github.com/gfazioli/mantine-spinner/blob/master/LICENSE',
  author: {
    name: 'Giovambattista Fazioli',
    githubUsername: 'gfazioli',
  },
};
