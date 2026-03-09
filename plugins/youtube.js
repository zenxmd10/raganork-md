const { Module } = require("../main");
const axios = require("axios");

const config = require("../config");
const MODE = config.MODE;
const fromMe = MODE === "public" ? false : true;

// 1. VIDEO DOWNLOADER (.video)
Module(
  {
    pattern: "video ?(.*)",
    fromMe: fromMe,
    desc: "Download YouTube video using Sparky API",
    usage: ".video <link>",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;

    if (url && /\bhttps?:\/\/\S+/gi.test(url)) {
      url = url.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return await message.sendReply(
        "_Please provide a valid YouTube link!_\n_Example: .video https://youtu.be/xxxxxx_"
      );
    }

    let downloadMsg;
    try {
      downloadMsg = await message.sendReply("_Downloading video..._");

      // Sparky Video API
      const apiUrl = `https://api.sparky.biz.id/api/downloader/ytv?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);

      if (!response.data || !response.data.status) {
        return await message.edit("_Error: Video not found or API down!_", message.jid, downloadMsg.key);
      }

      const videoData = response.data.data;
      await message.edit(`_Uploading: *${videoData.title}*..._`, message.jid, downloadMsg.key);

      await message.sendMessage(
        message.jid,
        { 
          video: { url: videoData.url }, 
          caption: `_*${videoData.title}*_` 
        },
        { quoted: message }
      );

      await message.edit("_Download complete!_", message.jid, downloadMsg.key);
    } catch (error) {
      console.error("Video error:", error);
      await message.edit("_Failed to download video._", message.jid, downloadMsg.key);
    }
  }
);

// 2. AUDIO/SONG DOWNLOADER (.audio)
Module(
  {
    pattern: "audio ?(.*)",
    fromMe: fromMe,
    desc: "Download YouTube audio using Sparky API",
    usage: ".audio <link or query>",
    use: "download",
  },
  async (message, match) => {
    let input = match[1] || message.reply_message?.text;

    if (!input) {
      return await message.sendReply(
        "_Please provide a link or song name!_\n_Example: .audio https://youtu.be/xxxxxx_"
      );
    }

    // Extract URL if present
    if (/\bhttps?:\/\/\S+/gi.test(input)) {
      input = input.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    let downloadMsg;
    try {
      downloadMsg = await message.sendReply("_Downloading audio..._");

      // Sparky Audio/Song API
      const apiUrl = `https://api.sparky.biz.id/api/downloader/song?search=${encodeURIComponent(input)}`;
      const response = await axios.get(apiUrl);

      if (!response.data || !response.data.status) {
        return await message.edit("_Error: Audio not found!_", message.jid, downloadMsg.key);
      }

      const audioData = response.data.data;
      await message.edit(`_Uploading: *${audioData.title}*..._`, message.jid, downloadMsg.key);

      await message.sendMessage(
        message.jid,
        { 
          audio: { url: audioData.url }, 
          mimetype: "audio/mpeg"
        },
        { quoted: message }
      );

      await message.edit(`_Successfully sent *${audioData.title}*_`, message.jid, downloadMsg.key);
    } catch (error) {
      console.error("Audio error:", error);
      await message.edit("_Failed to download audio._", message.jid, downloadMsg.key);
    }
  }
);
d, downloadMsg.key);

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    } catch (error) {
      console.error("Video download error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download failed. Please try again._");
      }

      if (videoPath && fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
  }
);

Module(
  {
    pattern: "yta ?(.*)",
    fromMe: fromMe,
    desc: "Download YouTube audio as document",
    usage: ".yta <link>",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;

    if (url && /\bhttps?:\/\/\S+/gi.test(url)) {
      url = url.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be"))) {
      return await message.sendReply(
        "_Please provide a valid YouTube link!_\n_Example: .yta https://youtube.com/watch?v=xxxxx or https://youtube.com/shorts/xxxxx_"
      );
    }

    // Convert YouTube Shorts URL to regular watch URL if needed
    if (url.includes("youtube.com/shorts/")) {
      const shortId = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/)?.[1];
      if (shortId) {
        url = `https://www.youtube.com/watch?v=${shortId}`;
      }
    }

    let downloadMsg;
    let audioPath;

    try {
      downloadMsg = await message.sendReply("_Downloading audio..._");
      const result = await downloadAudio(url);
      audioPath = result.path;

      const mp3Path = await convertM4aToMp3(audioPath);
      audioPath = mp3Path;

      await message.edit("_Sending audio..._", message.jid, downloadMsg.key);

      const stream = fs.createReadStream(audioPath);
      await message.sendMessage({ stream }, "document", {
        fileName: `${result.title}.m4a`,
        mimetype: "audio/mp4",
        caption: `_*${result.title}*_`,
      });
      stream.destroy();

      await message.edit("_Download complete!_", message.jid, downloadMsg.key);

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch (error) {
      console.error("YTA download error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download failed. Please try again._");
      }

      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
);

Module(
  {
    pattern: "play ?(.*)",
    fromMe: fromMe,
    desc: "Play audio from YouTube search or link",
    usage: ".play <song name or link>",
    use: "download",
  },
  async (message, match) => {
    let input = match[1] || message.reply_message?.text;
    if (!input) {
      return await message.sendReply(
        "_Please provide a song name or link!_\n_Example: .play faded alan walker_"
      );
    }

    let downloadMsg;
    let audioPath;

    try {
      let url = null;
      if (/\bhttps?:\/\/\S+/gi.test(input)) {
        const urlMatch = input.match(/\bhttps?:\/\/\S+/gi);
        if (
          urlMatch &&
          (urlMatch[0].includes("youtube.com") ||
            urlMatch[0].includes("youtu.be"))
        ) {
          url = urlMatch[0];
          // Convert YouTube Shorts URL to regular watch URL if needed
          if (url.includes("youtube.com/shorts/")) {
            const shortId = url.match(
              /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/
            )?.[1];
            if (shortId) {
              url = `https://www.youtube.com/watch?v=${shortId}`;
            }
          }
        }
      }

      if (url) {
        downloadMsg = await message.sendReply("_Downloading audio..._");
        const result = await downloadAudio(url);
        audioPath = result.path;

        const mp3Path = await convertM4aToMp3(audioPath);
        audioPath = mp3Path;

        await message.edit(
          `_Sending *${result.title}*..._`,
          message.jid,
          downloadMsg.key
        );

        const stream1 = fs.createReadStream(audioPath);
        await message.sendReply({ stream: stream1 }, "audio", {
          mimetype: "audio/mp4",
        });
        stream1.destroy();

        await message.edit(
          `_Downloaded *${result.title}*!_`,
          message.jid,
          downloadMsg.key
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      } else {
        const query = input;
        downloadMsg = await message.sendReply("_Searching..._");
        const results = await searchYoutube(query, 1);

        if (!results || results.length === 0) {
          return await message.edit(
            "_No results found!_",
            message.jid,
            downloadMsg.key
          );
        }

        const video = results[0];
        await message.edit(
          `_Downloading *${video.title}*..._`,
          message.jid,
          downloadMsg.key
        );

        const result = await downloadAudio(video.url);
        audioPath = result.path;

        const mp3Path = await convertM4aToMp3(audioPath);
        audioPath = mp3Path;

        await message.edit(
          `_Sending *${video.title}*..._`,
          message.jid,
          downloadMsg.key
        );

        const stream2 = fs.createReadStream(audioPath);
        await message.sendReply({ stream: stream2 }, "audio", {
          mimetype: "audio/mp4",
        });
        stream2.destroy();

        await message.edit(
          `_Downloaded *${video.title}*!_`,
          message.jid,
          downloadMsg.key
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }
    } catch (error) {
      console.error("Play error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download failed. Please try again._");
      }

      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
);

Module(
  {
    on: "text",
    fromMe: fromMe,
  },
  async (message, match) => {
    const numberMatch = message.text?.match(/^\d+$/);
    if (!numberMatch) return;
    const selectedNumber = parseInt(numberMatch[0]);
    if (
      !message.reply_message ||
      !message.reply_message.fromMe ||
      !message.reply_message.message
    ) {
      return;
    }
    const repliedText = message.reply_message.message;
    if (
      repliedText.includes("YouTube Search Results") &&
      repliedText.includes("to download audio")
    ) {
      if (selectedNumber < 1 || selectedNumber > 10) {
        return await message.sendReply("_Please select a number between 1-10_");
      }

      const lines = repliedText.split("\n");
      let videoTitle = null;
      let videoUrl = null;

      try {
        const queryMatch = repliedText.match(
          /Found \d+ results for:_\s*\*(.+?)\*/
        );
        if (!queryMatch) return;

        const query = queryMatch[1];
        const results = await searchYoutube(query, 10);

        if (!results[selectedNumber - 1]) {
          return await message.sendReply("_Invalid selection!_");
        }

        const selectedVideo = results[selectedNumber - 1];
        let downloadMsg;
        let audioPath;

        try {
          downloadMsg = await message.sendReply(
            `_Downloading *${selectedVideo.title}*..._`
          );

          const result = await downloadAudio(selectedVideo.url);
          audioPath = result.path;

          const mp3Path = await convertM4aToMp3(audioPath);
          audioPath = mp3Path;

          await message.edit(
            "_Sending audio..._",
            message.jid,
            downloadMsg.key
          );

          const stream3 = fs.createReadStream(audioPath);
          await message.sendReply({ stream: stream3 }, "audio", {
            mimetype: "audio/mp4",
          });
          stream3.destroy();

          await message.edit(
            "_Download complete!_",
            message.jid,
            downloadMsg.key
          );

          await new Promise((resolve) => setTimeout(resolve, 100));
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (error) {
          console.error("Song download error:", error);
          if (downloadMsg) {
            await message.edit(
              "_Download failed!_",
              message.jid,
              downloadMsg.key
            );
          }

          if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        }
      } catch (error) {
        console.error("Song selection error:", error);
        await message.sendReply("_Failed to process your selection._");
      }
    } else if (
      repliedText.includes("YouTube Search Results") &&
      repliedText.includes("see video details")
    ) {
      if (selectedNumber < 1 || selectedNumber > 10) {
        return await message.sendReply("_Please select a number between 1-10_");
      }

      try {
        const queryMatch = repliedText.match(
          /Found \d+ results for:_\s*\*(.+?)\*/
        );
        if (!queryMatch) return;

        const query = queryMatch[1];
        const results = await searchYoutube(query, 10);

        if (!results[selectedNumber - 1]) {
          return await message.sendReply("_Invalid selection!_");
        }

        const selectedVideo = results[selectedNumber - 1];

        const axios = require("axios");
        const thumbnailResponse = await axios.get(selectedVideo.thumbnail, {
          responseType: "arraybuffer",
        });
        const thumbnailBuffer = Buffer.from(thumbnailResponse.data);

        let caption = `_*${selectedVideo.title}*_\n\n`;
        caption += `*Channel:* ${selectedVideo.channel.name}\n`;
        caption += `*Duration:* \`${selectedVideo.duration}\`\n`;
        caption += `*Views:* \`${formatViews(selectedVideo.views)}\`\n`;
        caption += `*Uploaded:* ${selectedVideo.uploadedAt || "N/A"}\n\n`;
        caption += `*URL:* ${selectedVideo.url}\n\n`;
        caption += "_Reply with:_\n";
        caption += "*1.* Audio\n";
        caption += "*2.* Video";

        await message.sendReply(thumbnailBuffer, "image", {
          caption: caption,
        });
      } catch (error) {
        console.error("YTS video info error:", error);
        await message.sendReply("_Failed to fetch video info._");
      }
    } else if (
      repliedText.includes("Reply with:") &&
      repliedText.includes("* Audio")
    ) {
      if (selectedNumber !== 1 && selectedNumber !== 2) {
        return await message.sendReply(
          "_Please select 1 for Audio or 2 for Video_"
        );
      }

      try {
        const urlMatch = repliedText.match(/\*URL:\*\s*(https?:\/\/\S+)/m);
        if (!urlMatch) return;

        const url = urlMatch[1].trim();
        const titleMatch = repliedText.match(/_\*([^*]+)\*_/);
        const title = titleMatch ? titleMatch[1] : "Video";

        let downloadMsg;
        let filePath;

        if (selectedNumber === 1) {
          try {
            downloadMsg = await message.sendReply(`_Downloading audio..._`);

            const result = await downloadAudio(url);
            filePath = result.path;

            const mp3Path = await convertM4aToMp3(filePath);
            filePath = mp3Path;

            await message.edit(
              "_Sending audio..._",
              message.jid,
              downloadMsg.key
            );

            const stream4 = fs.createReadStream(filePath);
            await message.sendReply({ stream: stream4 }, "audio", {
              mimetype: "audio/mp4",
            });
            stream4.destroy();

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            console.error("YTS audio download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } else if (selectedNumber === 2) {
          try {
            downloadMsg = await message.sendReply(`_Downloading video..._`);

            const result = await downloadVideo(url, "360p");
            filePath = result.path;

            await message.edit(
              "_Uploading video..._",
              message.jid,
              downloadMsg.key
            );

            const stats = fs.statSync(filePath);

            if (stats.size > VIDEO_SIZE_LIMIT) {
              const stream5 = fs.createReadStream(filePath);
              await message.sendMessage({ stream: stream5 }, "document", {
                fileName: `${result.title}.mp4`,
                mimetype: "video/mp4",
                caption: `_*${result.title}*_\n\n_File size: ${formatBytes(
                  stats.size
                )}_\n_Quality: 360p_`,
              });
              stream5.destroy();
            } else {
              const stream6 = fs.createReadStream(filePath);
              await message.sendReply({ stream: stream6 }, "video", {
                caption: `_*${result.title}*_\n\n_Quality: 360p_`,
              });
              stream6.destroy();
            }

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            console.error("YTS video download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (filePath && fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        }
      } catch (error) {
        console.error("YTS download selection error:", error);
        await message.sendReply("_Failed to process download._");
      }
    } else if (
      repliedText.includes("Select Video Quality") &&
      repliedText.includes("Reply with a number")
    ) {
      try {
        const lines = repliedText.split("\n");
        let videoId = "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (
            line.startsWith("(") &&
            line.endsWith(")") &&
            line.length >= 13 &&
            !line.includes("Select") &&
            !line.includes("Reply") &&
            !line.match(/^\*\d+\./)
          ) {
            videoId = line.replace(/[()]/g, "").trim();
            if (videoId.length >= 10) break;
          }
        }

        if (!videoId || videoId.length < 10) {
          return await message.sendReply("_Failed to retrieve video ID._");
        }

        const url = `https://www.youtube.com/watch?v=${videoId}`;

        const titleMatch = repliedText.match(/_\*([^*]+)\*_/);
        if (!titleMatch) return;

        const qualityLines = lines.filter((line) => line.match(/^\*\d+\./));

        if (!qualityLines[selectedNumber - 1]) {
          return await message.sendReply("_Invalid quality selection!_");
        }

        const selectedLine = qualityLines[selectedNumber - 1];
        const isAudioOnly = selectedLine.includes("Audio Only");

        if (isAudioOnly) {
          let downloadMsg;
          let audioPath;

          try {
            downloadMsg = await message.sendReply("_Downloading audio..._");

            const result = await downloadAudio(url);
            audioPath = result.path;

            const mp3Path = await convertM4aToMp3(audioPath);
            audioPath = mp3Path;

            await message.edit(
              "_Sending audio..._",
              message.jid,
              downloadMsg.key
            );

            const stream = fs.createReadStream(audioPath);
            await message.sendMessage({ stream }, "document", {
              fileName: `${result.title}.m4a`,
              mimetype: "audio/mp4",
              caption: `_*${result.title}*_`,
            });
            stream.destroy();

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(audioPath)) {
              fs.unlinkSync(audioPath);
            }
          } catch (error) {
            console.error("YTV audio download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (audioPath && fs.existsSync(audioPath)) {
              fs.unlinkSync(audioPath);
            }
          }
        } else {
          const qualityMatch = selectedLine.match(/(\d+p)/);
          if (!qualityMatch) return;

          const selectedQuality = qualityMatch[1];

          let downloadMsg;
          let videoPath;

          try {
            downloadMsg = await message.sendReply(
              `_Downloading video at *${selectedQuality}*..._`
            );

            const result = await downloadVideo(url, selectedQuality);
            videoPath = result.path;

            await message.edit(
              "_Uploading video..._",
              message.jid,
              downloadMsg.key
            );

            const stats = fs.statSync(videoPath);

            if (stats.size > VIDEO_SIZE_LIMIT) {
              const stream7 = fs.createReadStream(videoPath);
              await message.sendMessage({ stream: stream7 }, "document", {
                fileName: `${result.title}.mp4`,
                mimetype: "video/mp4",
                caption: `_*${result.title}*_\n\n_File size: ${formatBytes(
                  stats.size
                )}_\n_Quality: ${selectedQuality}_`,
              });
              stream7.destroy();
            } else {
              const stream8 = fs.createReadStream(videoPath);
              await message.sendReply({ stream: stream8 }, "video", {
                caption: `_*${result.title}*_\n\n_Quality: ${selectedQuality}_`,
              });
              stream8.destroy();
            }

            await message.edit(
              "_Download complete!_",
              message.jid,
              downloadMsg.key
            );

            await new Promise((resolve) => setTimeout(resolve, 100));
            if (fs.existsSync(videoPath)) {
              fs.unlinkSync(videoPath);
            }
          } catch (error) {
            console.error("YTV video download error:", error);
            if (downloadMsg) {
              await message.edit(
                "_Download failed!_",
                message.jid,
                downloadMsg.key
              );
            }

            if (videoPath && fs.existsSync(videoPath)) {
              fs.unlinkSync(videoPath);
            }
          }
        }
      } catch (error) {
        console.error("YTV quality selection error:", error);
        await message.sendReply("_Failed to process quality selection._");
      }
    }
  }
);

Module(
  {
    pattern: "spotify ?(.*)",
    fromMe: fromMe,
    desc: "Download audio from Spotify link",
    usage: ".spotify <spotify link>",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;

    if (url && /\bhttps?:\/\/\S+/gi.test(url)) {
      url = url.match(/\bhttps?:\/\/\S+/gi)[0];
    }

    if (!url || !url.includes("spotify.com")) {
      return await message.sendReply(
        "_Please provide a valid Spotify link!_\n_Example: .spotify https://open.spotify.com/track/xxxxx_"
      );
    }

    let downloadMsg;
    let audioPath;

    try {
      downloadMsg = await message.sendReply("_Fetching Spotify info..._");
      const spotifyInfo = await spotifyTrack(url);
      const { title, artist } = spotifyInfo;

      await message.edit(
        `_Downloading *${title}* by *${artist}*..._`,
        message.jid,
        downloadMsg.key
      );

      const query = `${title} ${artist}`;
      const results = await searchYoutube(query, 1);

      if (!results || results.length === 0) {
        return await message.edit(
          "_No matching songs found on YouTube!_",
          message.jid,
          downloadMsg.key
        );
      }

      const video = results[0];
      const result = await downloadAudio(video.url);
      audioPath = result.path;

      const mp3Path = await convertM4aToMp3(audioPath);
      audioPath = mp3Path;

      await message.edit(
        "_Sending audio..._",
        message.jid,
        downloadMsg.key
      );

      const stream = fs.createReadStream(audioPath);
      await message.sendReply({ stream: stream }, "audio", {
        mimetype: "audio/mp4",
      });
      stream.destroy();

      await message.edit(
        "_Download complete!_",
        message.jid,
        downloadMsg.key
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch (error) {
      console.error("Spotify download error:", error);
      if (downloadMsg) {
        await message.edit("_Download failed!_", message.jid, downloadMsg.key);
      } else {
        await message.sendReply("_Download failed. Please try again._");
      }

      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
);

