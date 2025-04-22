import mongoose from "mongoose"

const downloadedVideoSchema = mongoose.Schema({
    videoid: { type: String, required: true },
    viewer: { type: String, required: true },
    downloadedOn: { type: Date, default: Date.now() }
})

export default mongoose.model("DownloadedVideo", downloadedVideoSchema)
